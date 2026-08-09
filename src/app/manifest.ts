import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "旅のしおり - 無料の旅行しおり作成アプリ",
    short_name: "旅のしおり",
    description:
      "旅行しおりを無料で簡単に作成・共有できるアプリ。日程・予算・ホテル・フライトの予約情報をひとまとめに管理。",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0d9488",
    lang: "ja",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
