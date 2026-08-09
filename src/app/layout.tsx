import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import * as gtag from "../../gtag";
import { Providers } from "./providers";
import { ApolloWrapper } from '@/lib/apollo-provider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "旅のしおり - 無料の旅行しおり作成アプリ",
    template: "%s | 旅のしおり"
  },
  description: "旅行しおりを無料で簡単に作成・共有できるアプリ。日程・予算・ホテル・フライトの予約情報をひとまとめに管理。URLひとつで家族や友人にしおりを共有でき、Googleマップで行き先を確認。アカウント登録不要。",
  keywords: [
    "旅行しおり", "旅行しおり作成", "しおり作成アプリ", "旅行しおり無料", "無料しおり作成",
    "旅のしおり", "旅行計画", "旅行プラン", "旅行スケジュール", "グループ旅行",
    "旅行共有", "予算管理", "旅程表", "ルート作成", "観光", "旅行"
  ],
  authors: [{ name: "旅のしおり" }],
  creator: "旅のしおり",
  publisher: "旅のしおり",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://travel-planner.vercel.app'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "旅のしおり - 無料の旅行しおり作成アプリ",
    description: "旅行しおりを無料で簡単に作成・共有できるアプリ。日程・予算・ホテル・フライトの予約情報をひとまとめに管理。URLひとつで家族や友人にしおりを共有。アカウント登録不要。",
    url: '/',
    siteName: "旅のしおり",
    locale: 'ja_JP',
    type: 'website',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: "旅のしおり - 無料の旅行しおり作成アプリ",
    description: "旅行しおりを無料で簡単に作成・共有。日程・予算・予約情報をひとまとめに管理できます。アカウント登録不要。",
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=${gtag.GA_MEASUREMENT_ID}`}
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gtag.GA_MEASUREMENT_ID}');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "旅のしおり",
              alternateName: ["旅行しおり作成アプリ", "旅行しおり", "しおり作成アプリ"],
              description:
                "旅行しおりを無料で作成・共有できるアプリ。日程・予算・ホテル・フライトの予約情報をひとまとめに管理し、URLひとつで家族や友人とプランを共有。Googleマップで行き先を確認できます。",
              url:
                process.env.NEXT_PUBLIC_BASE_URL ||
                "https://travel-planner.vercel.app",
              applicationCategory: "TravelApplication",
              operatingSystem: "Web, iOS, Android",
              browserRequirements: "HTML5をサポートするブラウザ",
              inLanguage: "ja",
              featureList: [
                "旅行しおりの無料作成",
                "URLによるしおり共有",
                "日程・スケジュール管理",
                "予算・費用管理",
                "ホテル・フライト予約情報の保存",
                "Googleマップ連携",
                "アカウント登録不要",
              ],
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "JPY",
              },
              publisher: {
                "@type": "Organization",
                name: "旅のしおり",
              },
            }),
          }}
        />
        <ApolloWrapper>
          <Providers>
            {children}
          </Providers>
        </ApolloWrapper>
      </body>
    </html>
  );
}
