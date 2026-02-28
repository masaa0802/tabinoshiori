import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://travel-planner.vercel.app";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // 個人の旅行プランはユーザー固有のページのためインデックスしない
      disallow: "/group/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
