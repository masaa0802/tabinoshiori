import Link from "next/link";
import { BLOG_NAME, SITE_NAME } from "@/lib/site";

export default function BlogLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link href="/blog" className="flex items-baseline gap-2 min-w-0">
            <span className="text-lg font-bold text-gray-900 truncate">
              {BLOG_NAME}
            </span>
            <span className="hidden text-xs text-gray-400 sm:inline">
              by {SITE_NAME}
            </span>
          </Link>

          <Link
            href="/group/new"
            className="flex-shrink-0 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
          >
            旅程を作る
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-20 border-t border-gray-100 bg-gray-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-lg font-bold text-gray-900">{BLOG_NAME}</p>
              <p className="mt-1 text-sm text-gray-500">
                旅行の準備でつまずきやすいところを解説しています。
              </p>
            </div>

            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <Link href="/" className="text-gray-500 transition-colors hover:text-gray-900">
                {SITE_NAME}について
              </Link>
              <Link href="/blog/feed.xml" className="text-gray-500 transition-colors hover:text-gray-900">
                RSS
              </Link>
              <Link href="/contact" className="text-gray-500 transition-colors hover:text-gray-900">
                お問い合わせ
              </Link>
            </nav>
          </div>

          <p className="mt-8 border-t border-gray-200 pt-6 text-xs text-gray-400">
            © {new Date().getFullYear()} {SITE_NAME}
          </p>
        </div>
      </footer>
    </div>
  );
}
