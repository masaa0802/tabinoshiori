import { GA_MEASUREMENT_ID } from "../../gtag";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

type GtagArgs = [command: string, target: string, params?: Record<string, unknown>];

/**
 * gtag を安全に呼ぶ。
 *
 * gtag.js は afterInteractive で読み込まれるため、初回描画直後はまだ window.gtag が無いことがある。
 * その場合は gtag 本体と同じく dataLayer に積んでおけば、読み込み後に送られる。
 * dataLayer には配列ではなく arguments オブジェクトを積む必要がある（gtag.js の仕様）。
 */
function callGtag(...args: GtagArgs): void;
function callGtag() {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID) return;
  if (typeof window.gtag === "function") {
    // eslint-disable-next-line prefer-rest-params
    (window.gtag as (...a: unknown[]) => void).apply(window, Array.from(arguments));
    return;
  }
  window.dataLayer = window.dataLayer || [];
  // eslint-disable-next-line prefer-rest-params
  window.dataLayer.push(arguments);
}

/** GA4 にイベントを送る。GA の ID が無い環境（ローカルなど）では何もしない */
export const trackEvent = (name: string, params: Record<string, unknown> = {}) => {
  callGtag("event", name, params);
};

/** GA4 のユーザープロパティを設定する（以降のイベント全てに付く） */
export const setUserProperties = (properties: Record<string, unknown>) => {
  callGtag("set", "user_properties", properties);
};
