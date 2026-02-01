import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新しいグループを作成",
  description: "旅行グループを作成して、友達や家族と一緒に旅行計画を立てましょう。旅のしおりで、思い出に残る旅を簡単に計画できます。",
  openGraph: {
    title: "新しいグループを作成 | 旅のしおり",
    description: "旅行グループを作成して、友達や家族と一緒に旅行計画を立てましょう。旅のしおりで、思い出に残る旅を簡単に計画できます。",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function GroupNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
