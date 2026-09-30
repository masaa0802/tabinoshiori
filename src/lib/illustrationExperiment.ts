import { useSyncExternalStore } from "react";
import { trackEvent, setUserProperties } from "@/lib/analytics";
import { ACTIVITY_SCENE_KEYS, getActivityImageKey, type ActivityImageSource } from "@/lib/activityTypeImage";

/**
 * イラストの効果を測る A/B テスト。
 *
 * ブラウザごとにランダムで2群に分け、片方（without）にはイラストを出さない。
 * 同じ期間の2群を比べることで、季節や利用者の違いを除いたイラストの効果が分かる。
 * 詳しい計測方法と GA4 での見方は docs/ILLUSTRATION_EXPERIMENT.md を参照。
 */
export const ILLUSTRATION_EXPERIMENT = {
  id: "illustration_v1",
  /** false にすると実験を終了し、全員にイラストを出す */
  active: true,
  /** イラストを出さない群（対照群）の割合 */
  controlRatio: 0.5,
} as const;

export type IllustrationVariant = "with" | "without";

const STORAGE_KEY = `tabinoshiori:experiment:${ILLUSTRATION_EXPERIMENT.id}`;
/** 確認用: URL に ?illustration=with / ?illustration=without を付けると、その群に固定される */
const OVERRIDE_PARAM = "illustration";

const isVariant = (value: unknown): value is IllustrationVariant => value === "with" || value === "without";

let assigned: IllustrationVariant | null = null;

const readStorage = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStorage = (variant: IllustrationVariant) => {
  try {
    localStorage.setItem(STORAGE_KEY, variant);
  } catch {
    // プライベートブラウズなどで保存できなくても、このページ表示中は同じ群を使う
  }
};

/**
 * このブラウザの群を返す。初回だけランダムに決めて localStorage に保存し、以降は同じ群を返す。
 * 実験を止めている時は全員 with。
 */
export const getIllustrationVariant = (): IllustrationVariant => {
  if (!ILLUSTRATION_EXPERIMENT.active) return "with";
  if (assigned) return assigned;

  const override = new URLSearchParams(window.location.search).get(OVERRIDE_PARAM);
  if (isVariant(override)) {
    assigned = override;
    writeStorage(assigned);
    return assigned;
  }

  const stored = readStorage();
  assigned = isVariant(stored)
    ? stored
    : Math.random() < ILLUSTRATION_EXPERIMENT.controlRatio
      ? "without"
      : "with";
  writeStorage(assigned);
  return assigned;
};

const noopSubscribe = () => () => {};

/**
 * 群を返すフック。サーバー描画とハイドレーション中は null（まだ決まっていない）。
 * null の間はイラストを出さないこと（対照群の人に一瞬イラストが見えるのを防ぐ）。
 */
export const useIllustrationVariant = (): IllustrationVariant | null =>
  useSyncExternalStore(noopSubscribe, getIllustrationVariant, () => null);

/** 実験の情報を付けて GA4 にイベントを送る */
export const trackIllustrationEvent = (name: string, params: Record<string, unknown> = {}) => {
  if (typeof window === "undefined") return;
  trackEvent(name, {
    experiment_id: ILLUSTRATION_EXPERIMENT.id,
    illustration_variant: getIllustrationVariant(),
    ...params,
  });
};

/** アクティビティについてのイベントに付ける共通のパラメータ */
export const activityEventParams = (activity: ActivityImageSource & { type?: string }) => {
  const imageKey = getActivityImageKey(activity);
  return {
    activity_type: activity.type ?? "unknown",
    // 対照群でも「出していたら何のイラストだったか」を送る。シーン別の比較に使う
    image_key: imageKey,
    is_scene: ACTIVITY_SCENE_KEYS.includes(imageKey),
  };
};

let reportedUserProperty = false;

/** 群を GA4 のユーザープロパティに入れる。ページ表示ごとに1回でよい */
export const reportIllustrationVariant = () => {
  if (reportedUserProperty || typeof window === "undefined") return;
  reportedUserProperty = true;
  setUserProperties({ illustration_variant: getIllustrationVariant() });
};
