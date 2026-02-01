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
    default: "旅のしおり - 旅行計画をもっと簡単に、もっと楽しく",
    template: "%s | 旅のしおり"
  },
  description: "思い出に残る旅行を、もっと簡単に。もっと楽しく。AIが提案する最適なルートで旅行プランを作成。友達や家族とリアルタイムで共有・編集できる旅行計画アプリです。",
  keywords: ["旅行計画", "旅のしおり", "旅行プラン", "旅行", "観光", "ルート作成", "旅行スケジュール", "グループ旅行", "旅行共有", "AI旅行プラン"],
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
  openGraph: {
    title: "旅のしおり - 旅行計画をもっと簡単に、もっと楽しく",
    description: "思い出に残る旅行を、もっと簡単に。もっと楽しく。AIが提案する最適なルートで旅行プランを作成。友達や家族とリアルタイムで共有・編集できる旅行計画アプリです。",
    url: '/',
    siteName: "旅のしおり",
    locale: 'ja_JP',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '旅のしおり - 旅行計画アプリ',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "旅のしおり - 旅行計画をもっと簡単に、もっと楽しく",
    description: "思い出に残る旅行を、もっと簡単に。もっと楽しく。AIが提案する最適なルートで旅行プランを作成。",
    images: ['/og-image.png'],
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
      <head>
        <Script
          strategy="afterInteractive"
          src={`https://www.googletagmanager.com/gtag/js?id=G-BN1E62264W`}
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
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ApolloWrapper>
          <Providers>
            {children}
          </Providers>
        </ApolloWrapper>
      </body>
    </html>
  );
}
