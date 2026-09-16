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
 * 種別ごとのヘッダーイラストのパスを返す。写真が無いアクティビティのフォールバック用。
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
  return `/images/activity-types/${motion ? "motion/" : ""}${name}.svg`;
};
