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
  blogs: "blogs",
  categories: "categories",
  spots: "spots",
} as const;

const serviceDomain = process.env.MICROCMS_SERVICE_DOMAIN;
const apiKey = process.env.MICROCMS_API_KEY;

/**
 * 環境変数が揃っているか。
 * false のとき queries.ts はローカルのシードデータにフォールバックする。
 */
export const isMicroCMSConfigured = Boolean(serviceDomain && apiKey);

export const microcmsClient = isMicroCMSConfigured
  ? createClient({
      serviceDomain: serviceDomain as string,
      apiKey: apiKey as string,
    })
  : null;
