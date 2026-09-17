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
