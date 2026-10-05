/**
 * microCMS クライアントの初期化。
 *
 * 重要: `server-only` を付けている。APIキーがクライアントバンドルに載るのを防ぐため。
 * クライアントコンポーネントから記事を取得したい場合は、このファイル（および queries.ts）を
 * 直接 import せず、`/api/blog/related` のような Route Handler を経由すること。
 *
 * 下書きの扱いについて:
 * 一覧取得（getList）は公開済みのコンテンツしか返さない。下書きを見るには
 * 記事ごとに発行される `draftKey` を使う（`/api/preview` と記事ページを参照）。
 *
 * 「下書き全取得」権限を使えば一覧にも下書きを混ぜられるが、**採用していない。**
 * その権限は専用のAPIキーに付け、本番にはそのキーを置かない運用が前提になる。
 * 現在のプランはAPIキーを1本しか作れず、本番と共用になってしまうため、
 * 権限を足した時点で本番に下書きが出る。プランを上げてキーを分けられるように
 * なるまでは、この方式を採らないこと。
 */
import "server-only";
import { createClient } from "microcms-js-sdk";

/** microCMS 側のエンドポイント（API）名 */
export const MICROCMS_ENDPOINTS = {
  articles: "articles",
  categories: "categories",
  spots: "spots",
  souvenirs: "souvenirs",
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
