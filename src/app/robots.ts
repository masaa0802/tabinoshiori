import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/**
 * 個人の旅行プラン（/group/）と管理画面（/admin/）は全クローラーから除外する。
 * ブログ記事は AI 検索からの流入も狙うため、主要な AI クローラーを明示的に許可している。
 */
const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-User",
  "PerplexityBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bingbot",
];

const DISALLOWED = ["/group/", "/admin/"];

/**
 * 旅程の作成ページ（/group/new）は入口として検索に載せたいので、/group/ の除外から外す。
 * サイトマップにも載せているため、ここで弾くと Search Console で
 * 「robots.txt によりブロックされましたが、送信されたURLです」と警告が出る。
 * Google はより長く一致するルールを優先するので、Allow: /group/new が Disallow: /group/ に勝つ。
 */
const ALLOWED = ["/", "/group/new"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ALLOWED,
        disallow: DISALLOWED,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: ALLOWED,
        disallow: DISALLOWED,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
