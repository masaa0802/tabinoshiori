import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description: "旅のしおりへのお問い合わせページ。ご質問やご要望がございましたら、お気軽にお問い合わせください。",
  openGraph: {
    title: "お問い合わせ | 旅のしおり",
    description: "旅のしおりへのお問い合わせページ。ご質問やご要望がございましたら、お気軽にお問い合わせください。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
