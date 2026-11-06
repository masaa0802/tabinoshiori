import Link from "next/link";
import { Klee_One, Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import CtaLink from "@/components/blog/CtaLink";
import { ANXIETY_TAGS } from "@/lib/microcms/tags";
import { BLOG_NAME, SITE_NAME } from "@/lib/site";

/*
 * ブログだけで使うフォント。「旅のノート」の雰囲気を出すため、
 * 見出しは明朝、本文は角の柔らかいゴシック、筆者のひとことは手書き風にする。
 * 日本語フォントは subsets に japanese が無いので latin を指定し、preload はしない
 * （next/font が unicode-range ごとに分割して配信するので、使う文字だけ読み込まれる）。
 */
const mincho = Shippori_Mincho({
  weight: ["600", "800"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-blog-mincho",
});

const gothic = Zen_Kaku_Gothic_New({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-blog-gothic",
});

const hand = Klee_One({
  weight: ["600"],
  subsets: ["latin"],
  display: "swap",
  preload: false,
  variable: "--font-blog-hand",
});

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div
      className={`${mincho.variable} ${gothic.variable} ${hand.variable} flex min-h-screen flex-col bg-paper font-gothic text-ink`}
    >
      <header className="sticky top-0 z-30 border-b border-rule bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6 sm:py-4">
          <Link href="/blog" className="flex min-w-0 items-baseline gap-2.5">
            <span className="truncate font-mincho text-xl font-extrabold tracking-[0.08em] text-ink sm:text-2xl">
              {BLOG_NAME}
            </span>
            <span className="flex-shrink-0 text-[11px] text-ink-muted sm:text-xs">by {SITE_NAME}</span>
          </Link>

          <div className="flex items-center gap-6">
            <nav aria-label="不安の種類" className="hidden md:block">
              <ul className="flex gap-5 text-sm">
                {ANXIETY_TAGS.map((tag) => (
                  <li key={tag.slug}>
                    <Link
                      href={`/blog/tag/${tag.slug}`}
                      className="text-ink-soft transition-colors hover:text-shu"
                    >
                      {tag.shortLabel}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* ヘッダーのCTAは記事を特定できないため slug を渡さない。
                記事別の紐付けは記事末尾のCTAで取る */}
            <CtaLink
              position="header"
              className="flex-shrink-0 rounded border-[1.5px] border-ink px-4 py-2 text-sm font-bold text-ink transition-colors hover:bg-ink hover:text-paper"
            >
              旅程を作る
            </CtaLink>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-rule bg-paper-deep px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-baseline gap-2.5">
                <span className="font-mincho text-xl font-extrabold tracking-[0.08em]">{BLOG_NAME}</span>
                <span className="text-xs text-ink-muted">by {SITE_NAME}</span>
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/" className="text-ink-soft transition-colors hover:text-shu">
                {SITE_NAME}について
              </Link>
              <Link href="/blog/feed.xml" className="text-ink-soft transition-colors hover:text-shu">
                RSS
              </Link>
              <Link href="/contact" className="text-ink-soft transition-colors hover:text-shu">
                お問い合わせ
              </Link>
            </nav>
          </div>

          <p className="mt-8 border-t border-rule pt-6 text-xs text-ink-muted">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}
