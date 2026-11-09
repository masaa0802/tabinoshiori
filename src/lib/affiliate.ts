/**
 * 宿の予約アフィリエイトリンクを組み立てる。
 *
 * - Trip.com アフィリエイト: 遷移先URLに `Allianceid` と `SID` を付ける
 * - バリューコマース: MyLink 形式（ck.jp.ap.valuecommerce.com 経由で遷移先URLへ飛ばす）
 *
 * IDはリンクに出る公開値なので NEXT_PUBLIC_ の環境変数で渡す（Netlify の環境変数に設定）。
 * 未設定の提携先はリンクを出さない。全部未設定なら予約導線そのものが表示されない。
 *
 * NEXT_PUBLIC_ の値はビルド時に埋め込まれるため、process.env.XXX と文字どおりに書く必要がある
 * （動的なキーで参照すると埋め込まれない）。
 */

export type AffiliateProvider = "tripcom" | "jalan" | "yahoo_travel" | "ikyu";

export type AffiliatePlacement = "activity_sheet" | "day_hotel_gap";

export interface HotelSearchQuery {
  /** 宿名や地名。宿名が分かればそれを、無ければ行き先を入れる */
  keyword: string;
  /** チェックイン日 YYYY-MM-DD */
  checkin?: string;
  /** チェックアウト日 YYYY-MM-DD */
  checkout?: string;
  /** 国内旅行か海外旅行か。並び順と出す提携先を変える */
  tripType?: "domestic" | "overseas" | string;
}

export interface AffiliateLink {
  provider: AffiliateProvider;
  /** ボタンに出すサービス名 */
  label: string;
  url: string;
}

const TRIPCOM_ALLIANCE_ID = process.env.NEXT_PUBLIC_TRIPCOM_ALLIANCE_ID ?? "";
const TRIPCOM_SID = process.env.NEXT_PUBLIC_TRIPCOM_SID ?? "";
const VC_SID = process.env.NEXT_PUBLIC_VC_SID ?? "";

/**
 * バリューコマース経由の提携先。pid は広告主（プログラム）ごとに違う。
 * searchUrl は各予約サイトの検索結果ページ。リンクの遷移先として MyLink に包む。
 */
const VC_PARTNERS: {
  provider: Exclude<AffiliateProvider, "tripcom">;
  label: string;
  pid: string;
  /** 海外旅行でも出すか */
  overseas: boolean;
  searchUrl: (q: HotelSearchQuery) => string;
}[] = [
  {
    provider: "jalan",
    label: "じゃらん",
    pid: process.env.NEXT_PUBLIC_VC_PID_JALAN ?? "",
    overseas: false,
    searchUrl: (q) => `https://www.jalan.net/uw/uwp2011/uww2011init.do?${new URLSearchParams({ keyword: q.keyword })}`,
  },
  {
    provider: "yahoo_travel",
    label: "Yahoo!トラベル",
    pid: process.env.NEXT_PUBLIC_VC_PID_YAHOO_TRAVEL ?? "",
    overseas: false,
    searchUrl: (q) => `https://travel.yahoo.co.jp/search/?${new URLSearchParams({ keyword: q.keyword })}`,
  },
  {
    provider: "ikyu",
    label: "一休.com",
    pid: process.env.NEXT_PUBLIC_VC_PID_IKYU ?? "",
    overseas: false,
    searchUrl: (q) => `https://www.ikyu.com/search/?${new URLSearchParams({ keyword: q.keyword })}`,
  },
];

/** Trip.com の宿検索URL（日本語サイト・円表示）にアフィリエイトIDを付ける */
function tripcomHotelUrl(q: HotelSearchQuery, placement: AffiliatePlacement): string {
  const params = new URLSearchParams({ keyword: q.keyword });
  if (q.checkin) params.set("checkin", q.checkin);
  if (q.checkout) params.set("checkout", q.checkout);
  params.set("curr", "JPY");
  params.set("locale", "ja-JP");
  params.set("Allianceid", TRIPCOM_ALLIANCE_ID);
  params.set("SID", TRIPCOM_SID);
  // どの導線から来た予約かをレポートで分けるためのサブID
  params.set("trip_sub1", placement);
  return `https://jp.trip.com/hotels/list?${params}`;
}

/** バリューコマースの MyLink 形式。遷移先URLを vc_url に入れる */
function valueCommerceUrl(pid: string, destination: string): string {
  const params = new URLSearchParams({ sid: VC_SID, pid, vc_url: destination });
  return `https://ck.jp.ap.valuecommerce.com/servlet/referral?${params}`;
}

/** 予約リンクを1つでも出せる設定になっているか */
export function hasAffiliateConfig(): boolean {
  return Boolean(
    (TRIPCOM_ALLIANCE_ID && TRIPCOM_SID) || (VC_SID && VC_PARTNERS.some((p) => p.pid))
  );
}

/**
 * 宿の検索リンクを、設定済みの提携先の分だけ返す。
 * 海外旅行は Trip.com を先頭に、国内旅行は国内の予約サイトを先に並べる。
 */
export function buildHotelSearchLinks(
  q: HotelSearchQuery,
  placement: AffiliatePlacement
): AffiliateLink[] {
  const keyword = q.keyword.trim();
  if (!keyword) return [];
  const query = { ...q, keyword };
  const overseas = q.tripType === "overseas";

  const tripcom: AffiliateLink[] =
    TRIPCOM_ALLIANCE_ID && TRIPCOM_SID
      ? [{ provider: "tripcom", label: "Trip.com", url: tripcomHotelUrl(query, placement) }]
      : [];

  const domestic: AffiliateLink[] = VC_SID
    ? VC_PARTNERS.filter((p) => p.pid && (!overseas || p.overseas)).map((p) => ({
        provider: p.provider,
        label: p.label,
        url: valueCommerceUrl(p.pid, p.searchUrl(query)),
      }))
    : [];

  return overseas ? [...tripcom, ...domestic] : [...domestic, ...tripcom];
}

/** YYYY-MM-DD の n 日後を YYYY-MM-DD で返す（タイムゾーンの影響を受けないよう UTC で計算） */
export function shiftDate(date: string, days: number): string | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return undefined;
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + days));
  return d.toISOString().slice(0, 10);
}

/** YYYY-MM-DD の翌日 */
export const nextDate = (date: string) => shiftDate(date, 1);

/** 「東京都, 京都府」のような複数の行き先から、宿検索に使う最初の1つを取り出す */
export function primaryDestination(destination: string | undefined): string {
  return (destination ?? "").split(/[,、，]/)[0].trim();
}
