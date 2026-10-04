/**
 * microCMS クライアントの初期化。
 *
 * 重要: `server-only` を付けている。APIキーがクライアントバンドルに載るのを防ぐため。
 * クライアントコンポーネントから記事を取得したい場合は、このファイル（および queries.ts）を
 * 直接 import せず、`/api/blog/related` のような Route Handler を経由すること。
 */
import "server-only";
import { createClient } from "microcms-js-sdk";

/** microCMS 側のエンドポイント（API）名 */
export const MICROCMS_ENDPOINTS = {
  articles: "articles",
  categories: "categories",
  spots: "spots",
} as const;

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

/**
 * 下書きを取得してよい環境か。
 *
 * **許可リスト方式で書くこと。** `!== "production"` のような否定で書くと、
 * `CONTEXT` が何らかの理由で落ちたときに本番で下書きが出てしまう。
 * 知らない環境では必ず false を返す（フェイルクローズ）。
 *
 * `CONTEXT` は Netlify がデプロイコンテキストごとに自動で入れる環境変数。
 * ローカルでは存在しないため、`NODE_ENV` で判定する。
 */
function resolveDraftsAllowed(): boolean {
  const context = process.env.CONTEXT;
  if (context === "deploy-preview" || context === "branch-deploy") return true;
  if (!context && process.env.NODE_ENV === "development") return true;
  return false;
}

/**
 * 下書き取得用のAPIキー。microCMS 側で「下書き全取得」権限を付けたキーを使う。
 *
 * **Production コンテキストには設定しないこと。** これが2枚目の安全装置になる。
 * 上の環境分岐を誤っても、鍵が無ければ下書きは取得できない。
 */
const draftApiKey = process.env.MICROCMS_DRAFT_API_KEY;

/**
 * 下書きを含めて取得するか。
 * 環境が許可されていて、かつ下書き用のキーが設定されているときだけ true。
 */
export const includeDrafts = Boolean(
  serviceDomain && draftApiKey && resolveDraftsAllowed()
);

/**
 * 環境変数が揃っているか。
 * false のとき queries.ts はローカルのシードデータにフォールバックする。
 */
export const isMicroCMSConfigured = Boolean(
  serviceDomain && (apiKey || (draftApiKey && includeDrafts))
);

/**
 * 下書きを含める環境では、そのキーで作ったクライアントを使う。
 *
 * microCMS の「下書き全取得」はリクエストパラメータではなく**APIキーの権限**で効く。
 * そのため、クライアントをキーごと差し替えるのが唯一の切り替え方法になる。
 */
export const microcmsClient = isMicroCMSConfigured
  ? createClient({
      serviceDomain: serviceDomain as string,
      apiKey: (includeDrafts ? draftApiKey : apiKey) as string,
    })
  : null;
