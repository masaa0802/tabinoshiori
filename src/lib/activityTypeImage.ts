import { preload } from "react-dom";

const ACTIVITY_TYPE_KEYS = [
  "transport",
  "sightseeing",
  "restaurant",
  "hotel",
  "activity",
  "area",
] as const;

type ActivityTypeKey = (typeof ACTIVITY_TYPE_KEYS)[number];

const isActivityTypeKey = (type?: string): type is ActivityTypeKey =>
  !!type && (ACTIVITY_TYPE_KEYS as readonly string[]).includes(type);

/**
 * イラストを描き直したら上げる。next.config.ts で immutable キャッシュを
 * 張っているため、この値を変えない限りブラウザは古い画像を使い続ける。
 */
const ASSET_VERSION = "1";

/**
 * 種別ごとのヘッダーイラストのパスを返す。
 *
 * motion: true は動き付き。<img> 内の SVG アニメーションは表示枚数に比例して
 * 重くなるため、同時に1枚しか出ない詳細シート／詳細モーダルだけで使う。
 * リストや地図など何枚も並ぶ場所では静止版（既定）を使うこと。
 */
export const getActivityTypeImage = (
  type?: string,
  { motion = false }: { motion?: boolean } = {}
) => {
  const name = isActivityTypeKey(type) ? type : "default";
  return `/images/activity-types/${motion ? "motion/" : ""}${name}.svg?v=${ASSET_VERSION}`;
};

/**
 * 渡された種別のヘッダーイラストを先読みする。
 *
 * 詳細シートを初めて開く時だけ画像の取得が入るため、一覧を表示した時点で
 * 出てくる種別ぶんだけ取りに行っておく。2回目以降は immutable キャッシュから
 * 読まれるので、この関数が実際に通信するのはセッションごとに1回だけ。
 * 同じ URL への重複呼び出しは React 側で無視される。
 */
export const preloadActivityTypeImages = (
  types: Array<string | undefined>,
  options: { motion?: boolean } = {}
) => {
  const seen = new Set<string>();

  for (const type of types) {
    const href = getActivityTypeImage(type, options);
    if (seen.has(href)) continue;
    seen.add(href);
    preload(href, { as: "image" });
  }
};
