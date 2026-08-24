/**
 * サイト全体で共有する定数。
 * クライアント・サーバーの双方から読むため、server-only にしないこと。
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://tabinoshiori.jp";

export const SITE_NAME = "旅のしおり";

/** ブログ（メディア）の表示名。セクション7-(2)の議論により変更の可能性あり */
export const BLOG_NAME = "旅行ガイド";

export const BLOG_DESCRIPTION =
  "はじめての旅行でつまずきやすいポイントを、準備から現地での動き方までまとめて解説します。";

export const LOGO_URL = `${SITE_URL}/apple-touch-icon.png`;

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

/** 絶対URLを組み立てる。パスは先頭スラッシュ付きで渡す */
export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
