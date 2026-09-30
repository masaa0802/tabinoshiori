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

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOWED,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
