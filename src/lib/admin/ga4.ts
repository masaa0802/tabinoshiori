/**
 * 管理画面: GA4 Data API から、ブログ記事ごとのビュー数と流入元を読む。
 *
 * GA4 の画面を開かなくても、管理画面で「どの記事が・どこから読まれているか」を
 * 見られるようにするためのもの。データは GA4（tabinoshiori.jp で計測中）にあるので、
 * 自前で計測し直さず、GA4 に問い合わせて表示するだけにしている。
 *
 * 認証はサービスアカウント。Google のライブラリは入れず、JWT を自前で署名して
 * アクセストークンを取る（依存を増やさない・関数のサイズを抑えるため）。
 *
 * 必要な環境変数（Netlify の Functions スコープに設定する）:
 * - GA4_PROPERTY_ID   … GA4 のプロパティID（数字だけ）
 * - GA4_CLIENT_EMAIL  … サービスアカウントのメールアドレス
 * - GA4_PRIVATE_KEY   … サービスアカウントの秘密鍵（JSON の private_key の値。\n はそのままでよい）
 * サービスアカウントは GA4 のプロパティに「閲覧者」で追加しておく。
 * 手順は docs/BLOG_ANALYTICS.md の「管理画面で記事ごとの数字を見る」。
 *
 * GA4 のデータは集計に数時間〜1日ほどかかるので、今日の数字は少なめに出る。
 */
import "server-only";
import { createSign } from "crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

/** 流入元の分類。GA4 のデフォルトチャネルグループを、見やすい5つにまとめる */
export const CHANNELS = ["search", "social", "direct", "referral", "other"] as const;
export type Channel = (typeof CHANNELS)[number];

export const CHANNEL_LABELS: Record<Channel, string> = {
  search: "検索",
  social: "SNS",
  direct: "直接",
  referral: "他サイト",
  other: "その他",
};

export type SourceRow = { source: string; channel: Channel; views: number };

export type ArticleStats = {
  slug: string;
  views: number;
  users: number;
  /** ページに滞在していた時間の合計（秒）。1ビューあたりに割って使う */
  engagementSeconds: number;
  byChannel: Record<Channel, number>;
  /** 参照元（google, t.co, (direct) など）ごとのビュー数。多い順 */
  sources: SourceRow[];
};

export type BlogStatsResult =
  | { ok: true; articles: ArticleStats[] }
  | { ok: false; reason: "not_configured" | "error"; message?: string };

function getConfig() {
  const propertyId = process.env.GA4_PROPERTY_ID?.trim();
  const clientEmail = process.env.GA4_CLIENT_EMAIL?.trim();
  // Netlify の画面に貼ると改行が \n の文字列になるので、本物の改行に戻す
  const privateKey = process.env.GA4_PRIVATE_KEY?.replace(/\\n/g, "\n").trim();
  if (!propertyId || !clientEmail || !privateKey) return null;
  return { propertyId, clientEmail, privateKey };
}

export function isGa4Configured(): boolean {
  return getConfig() !== null;
}

/** GA4 の sessionDefaultChannelGroup を5分類に寄せる */
export function toChannel(group: string): Channel {
  const g = group.toLowerCase();
  if (g.includes("search")) return "search"; // Organic Search / Paid Search
  if (g.includes("social")) return "social"; // Organic Social / Paid Social
  if (g === "direct") return "direct";
  if (g === "referral") return "referral";
  return "other"; // Email, Unassigned など
}

/** /blog/<slug> だけを記事として数える。一覧・カテゴリ・タグのページは除く */
export function articleSlugFromPath(path: string): string | null {
  const m = path.split("?")[0].match(/^\/blog\/([^/]+)\/?$/);
  if (!m) return null;
  const slug = decodeURIComponent(m[1]);
  if (slug === "category" || slug === "tag" || slug === "tags") return null;
  return slug;
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.expiresAt - 60 > now) return cachedToken.token;

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  );
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claim}`);
  const signature = signer.sign(privateKey).toString("base64url");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`,
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Googleの認証に失敗しました（${res.status}）: ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: json.access_token, expiresAt: now + json.expires_in };
  return json.access_token;
}

type ReportRow = { dimensionValues: { value: string }[]; metricValues: { value: string }[] };

async function runReport(
  propertyId: string,
  token: string,
  body: Record<string, unknown>
): Promise<ReportRow[]> {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    }
  );
  if (!res.ok) {
    throw new Error(`GA4からの取得に失敗しました（${res.status}）: ${await res.text()}`);
  }
  const json = (await res.json()) as { rows?: ReportRow[] };
  return json.rows ?? [];
}

const BLOG_PATH_FILTER = {
  filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/blog/" } },
};

/**
 * 直近 days 日（今日を含む）の記事ごとの数字を返す。ビュー数の多い順。
 * GA4 のページパスは末尾スラッシュやクエリ付きで分かれることがあるので、slug でまとめ直す。
 */
export async function getBlogArticleStats(days: number): Promise<BlogStatsResult> {
  const config = getConfig();
  if (!config) return { ok: false, reason: "not_configured" };

  try {
    const token = await getAccessToken(config.clientEmail, config.privateKey);
    const dateRanges = [{ startDate: `${days - 1}daysAgo`, endDate: "today" }];

    const [totals, bySource] = await Promise.all([
      runReport(config.propertyId, token, {
        dateRanges,
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }, { name: "totalUsers" }, { name: "userEngagementDuration" }],
        dimensionFilter: BLOG_PATH_FILTER,
        limit: 1000,
      }),
      runReport(config.propertyId, token, {
        dateRanges,
        dimensions: [{ name: "pagePath" }, { name: "sessionDefaultChannelGroup" }, { name: "sessionSource" }],
        metrics: [{ name: "screenPageViews" }],
        dimensionFilter: BLOG_PATH_FILTER,
        limit: 10000,
      }),
    ]);

    const map = new Map<string, ArticleStats>();
    const get = (slug: string) => {
      let entry = map.get(slug);
      if (!entry) {
        entry = {
          slug,
          views: 0,
          users: 0,
          engagementSeconds: 0,
          byChannel: { search: 0, social: 0, direct: 0, referral: 0, other: 0 },
          sources: [],
        };
        map.set(slug, entry);
      }
      return entry;
    };

    for (const row of totals) {
      const slug = articleSlugFromPath(row.dimensionValues[0].value);
      if (!slug) continue;
      const entry = get(slug);
      entry.views += Number(row.metricValues[0].value) || 0;
      // 同じ記事の別パス（末尾スラッシュ違いなど）の人数を足すので、わずかに多めになりうる
      entry.users += Number(row.metricValues[1].value) || 0;
      entry.engagementSeconds += Number(row.metricValues[2].value) || 0;
    }

    for (const row of bySource) {
      const slug = articleSlugFromPath(row.dimensionValues[0].value);
      if (!slug) continue;
      const entry = get(slug);
      const channel = toChannel(row.dimensionValues[1].value);
      const source = row.dimensionValues[2].value || "(not set)";
      const views = Number(row.metricValues[0].value) || 0;
      entry.byChannel[channel] += views;
      const existing = entry.sources.find((s) => s.source === source && s.channel === channel);
      if (existing) existing.views += views;
      else entry.sources.push({ source, channel, views });
    }

    const articles = [...map.values()]
      .map((a) => ({ ...a, sources: a.sources.sort((x, y) => y.views - x.views) }))
      .sort((a, b) => b.views - a.views);
    return { ok: true, articles };
  } catch (e) {
    console.error("[admin/ga4]", e);
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e) };
  }
}
