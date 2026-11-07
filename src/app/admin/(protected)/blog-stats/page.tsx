/**
 * 管理画面: ブログ記事ごとのビュー数と流入元。
 *
 * 数字は GA4 から読む（src/lib/admin/ga4.ts）。本番サイト（tabinoshiori.jp）の計測なので、
 * デプロイプレビューで開いても本番の数字が出る。
 */
import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin/session";
import {
  CHANNELS,
  CHANNEL_LABELS,
  getBlogArticleStats,
  type ArticleStats,
  type Channel,
} from "@/lib/admin/ga4";
import { getAllPosts } from "@/lib/microcms/queries";

export const dynamic = "force-dynamic";

const CHANNEL_COLORS: Record<Channel, string> = {
  search: "bg-emerald-500",
  social: "bg-sky-500",
  direct: "bg-gray-400",
  referral: "bg-amber-500",
  other: "bg-purple-400",
};

const SOURCE_LABELS: Record<string, string> = {
  "(direct)": "直接（ブックマーク・URL入力・アプリ内など）",
  google: "Google",
  yahoo: "Yahoo!",
  bing: "Bing",
  "t.co": "X（旧Twitter）",
  "x.com": "X（旧Twitter）",
  "l.instagram.com": "Instagram",
  "instagram.com": "Instagram",
  "m.facebook.com": "Facebook",
  "l.facebook.com": "Facebook",
  "line.me": "LINE",
};

function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s}秒`;
  return `${Math.floor(s / 60)}分${String(s % 60).padStart(2, "0")}秒`;
}

function emptyStats(slug: string): ArticleStats {
  return {
    slug,
    views: 0,
    users: 0,
    engagementSeconds: 0,
    byChannel: { search: 0, social: 0, direct: 0, referral: 0, other: 0 },
    sources: [],
  };
}

function ChannelBar({ byChannel, views }: { byChannel: Record<Channel, number>; views: number }) {
  if (views === 0) return <div className="h-2 rounded bg-gray-100" />;
  return (
    <div className="flex h-2 overflow-hidden rounded bg-gray-100">
      {CHANNELS.map((channel) =>
        byChannel[channel] > 0 ? (
          <span
            key={channel}
            className={CHANNEL_COLORS[channel]}
            style={{ width: `${(byChannel[channel] / views) * 100}%` }}
            title={`${CHANNEL_LABELS[channel]} ${byChannel[channel]}`}
          />
        ) : null
      )}
    </div>
  );
}

export default async function AdminBlogStatsPage() {
  if (!(await isAdminSession())) redirect("/admin/login");

  // 期間は選ばせず、計測開始からの累計だけを出す（記事が少ないうちは期間を切ると数字が小さすぎて比べられない）
  const [result, posts] = await Promise.all([getBlogArticleStats(), getAllPosts()]);
  const titles = new Map(posts.map((post) => [post.slug, post.title]));

  // GA4 に1ビューもない公開記事も「0」として並べる（まだ読まれていないことが分かるように）
  let articles: ArticleStats[] = [];
  if (result.ok) {
    const seen = new Set(result.articles.map((a) => a.slug));
    articles = [
      ...result.articles,
      ...posts.filter((p) => !p.isDraft && !seen.has(p.slug)).map((p) => emptyStats(p.slug)),
    ];
  }
  const totalViews = articles.reduce((sum, a) => sum + a.views, 0);
  const totalByChannel = Object.fromEntries(
    CHANNELS.map((c) => [c, articles.reduce((sum, a) => sum + a.byChannel[c], 0)])
  ) as Record<Channel, number>;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
          ← ダッシュボード
        </Link>
        <h2 className="mt-1 text-xl font-bold text-gray-800">記事ごとのビュー数と流入元</h2>
        <p className="mt-1 text-sm text-gray-500">
          GA4（本番 tabinoshiori.jp）の、計測開始からの累計です。反映まで数時間〜1日かかるため、今日の分は少なめに出ます。
        </p>
      </div>


      {!result.ok && result.reason === "not_configured" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">GA4 との接続がまだ設定されていません</p>
          <p className="mt-1">
            Netlify の環境変数に GA4_PROPERTY_ID・GA4_CLIENT_EMAIL・GA4_PRIVATE_KEY を設定すると表示されます。
            手順は docs/BLOG_ANALYTICS.md の「管理画面で記事ごとの数字を見る」を参照してください。
          </p>
        </div>
      )}

      {!result.ok && result.reason === "error" && (
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 text-sm text-red-600">
          <p className="font-medium">GA4 からの取得に失敗しました</p>
          <p className="mt-1 break-all font-mono text-xs">{result.message}</p>
        </div>
      )}

      {result.ok && (
        <>
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-xs text-gray-500">記事の合計ビュー（計測開始からの累計）</p>
            <p className="text-3xl font-bold text-gray-800">{totalViews.toLocaleString()}</p>
            <div className="mt-4">
              <ChannelBar byChannel={totalByChannel} views={totalViews} />
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-600">
              {CHANNELS.map((c) => (
                <li key={c} className="flex items-center gap-1.5">
                  <span className={`inline-block h-2.5 w-2.5 rounded-sm ${CHANNEL_COLORS[c]}`} />
                  {CHANNEL_LABELS[c]}
                  <span className="tabular-nums text-gray-800">{totalByChannel[c].toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <div className="hidden grid-cols-[1fr_5rem_5rem_6rem] gap-3 border-b border-gray-100 px-5 py-2 text-xs text-gray-500 md:grid">
              <span>記事（行を押すと参照元の内訳）</span>
              <span className="text-right">ビュー</span>
              <span className="text-right">読者数</span>
              <span className="text-right">平均滞在</span>
            </div>
            {articles.length === 0 && (
              <p className="p-6 text-sm text-gray-500">まだビューはありません。</p>
            )}
            {articles.map((a) => (
              <details key={a.slug} className="group border-b border-gray-100 last:border-0">
                <summary className="cursor-pointer list-none px-5 py-3 hover:bg-gray-50">
                  <div className="grid grid-cols-3 gap-3 md:grid-cols-[1fr_5rem_5rem_6rem]">
                    <div className="col-span-3 min-w-0 md:col-span-1">
                      <p className="truncate text-sm font-medium text-gray-800">
                        {titles.get(a.slug) ?? a.slug}
                      </p>
                      <p className="truncate text-xs text-gray-400">/blog/{a.slug}</p>
                    </div>
                    <Metric label="ビュー" value={a.views.toLocaleString()} strong />
                    <Metric label="読者数" value={a.users.toLocaleString()} />
                    <Metric
                      label="平均滞在"
                      value={a.views ? formatDuration(a.engagementSeconds / a.views) : "—"}
                    />
                  </div>
                  <div className="mt-2">
                    <ChannelBar byChannel={a.byChannel} views={a.views} />
                  </div>
                </summary>
                <div className="bg-gray-50 px-5 py-3">
                  {a.sources.length === 0 ? (
                    <p className="text-sm text-gray-500">まだビューはありません。</p>
                  ) : (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-gray-500">
                          <th className="py-1 font-normal">参照元</th>
                          <th className="whitespace-nowrap py-1 pl-3 font-normal">分類</th>
                          <th className="whitespace-nowrap py-1 pl-3 text-right font-normal">ビュー</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.sources.map((s) => (
                          <tr key={`${s.channel}/${s.source}`} className="border-t border-gray-200">
                            <td className="py-1.5 text-gray-800">
                              {SOURCE_LABELS[s.source] ?? s.source}
                              {SOURCE_LABELS[s.source] && (
                                <span className="ml-1 text-xs text-gray-400">{s.source}</span>
                              )}
                            </td>
                            <td className="whitespace-nowrap py-1.5 pl-3 text-gray-600">{CHANNEL_LABELS[s.channel]}</td>
                            <td className="whitespace-nowrap py-1.5 pl-3 text-right tabular-nums">{s.views.toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  <Link
                    href={`/blog/${a.slug}`}
                    target="_blank"
                    className="mt-2 inline-block text-xs text-gray-500 hover:underline"
                  >
                    記事を開く ↗
                  </Link>
                </div>
              </details>
            ))}
          </section>

          <p className="text-xs leading-relaxed text-gray-500">
            ビュー＝記事が表示された回数、読者数＝見た人の数（GA4 の推定）、平均滞在＝1ビューあたりの閲覧時間です。
            「直接」には公開直後の自分の確認や、参照元を送らないアプリ・ボットの訪問も含まれます。
            平均滞在が数秒しかない記事は、まだ本当の読者が少ないと考えてください。
          </p>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="md:text-right">
      <p className="text-[11px] text-gray-400 md:hidden">{label}</p>
      <p className={`tabular-nums ${strong ? "text-base font-bold text-gray-800" : "text-sm text-gray-700"}`}>
        {value}
      </p>
    </div>
  );
}
