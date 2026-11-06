/**
 * 管理画面: ブログ記事末の読者アンケートの集計。
 *
 * /admin 配下なので middleware.ts のログイン確認を通った人だけが開ける。
 * 開いているドメインのストアを読む（本番なら本番の票、デプロイプレビューならプレビューの票）。
 */
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin/session";
import { listPollSummaries } from "@/lib/pollStore";
import { getAllPosts } from "@/lib/microcms/queries";

export const dynamic = "force-dynamic";

function formatDateTime(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" });
}

export default async function AdminPollsPage() {
  if (!(await isAdminSession())) redirect("/admin/login");
  const host = (await headers()).get("host")?.split(":")[0] ?? "";
  const [summaries, posts] = await Promise.all([
    listPollSummaries({ hostname: host, isDraft: false }),
    getAllPosts(),
  ]);
  const titles = new Map(posts.map((post) => [post.slug, post.title]));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-800">
            ← ダッシュボード
          </Link>
          <h2 className="mt-1 text-xl font-bold text-gray-800">読者アンケートの集計</h2>
          <p className="mt-1 text-sm text-gray-500">
            新しく投票があった順。文言を変えたアンケートは別の行として残ります。
          </p>
        </div>
        <a
          href="/admin/polls/export"
          className="rounded bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
        >
          1票ずつのCSVをダウンロード
        </a>
      </div>

      {summaries.length === 0 && (
        <p className="rounded-lg bg-white p-6 text-sm text-gray-500">まだ投票はありません。</p>
      )}

      {summaries.map((summary) => {
        const total = summary.counts.reduce((sum, value) => sum + value, 0);
        return (
          <section key={`${summary.slug}/${summary.pollId}`} className="rounded-lg bg-white p-6 shadow-sm">
            <p className="text-xs text-gray-500">
              <Link href={`/blog/${summary.slug}`} className="hover:underline" target="_blank">
                {titles.get(summary.slug) ?? summary.slug}
              </Link>
              {" ・ "}最終投票 {formatDateTime(summary.updatedAt)}
            </p>
            <h3 className="mt-1 font-bold text-gray-800">{summary.question || "（質問文なし）"}</h3>
            <ul className="mt-4 space-y-2">
              {summary.counts.map((count, index) => {
                const rate = total ? Math.round((count / total) * 100) : 0;
                return (
                  <li key={index} className="relative overflow-hidden rounded border border-gray-200">
                    <span className="absolute inset-y-0 left-0 bg-orange-100" style={{ width: `${rate}%` }} />
                    <span className="relative flex justify-between gap-3 px-3 py-2 text-sm">
                      <span>{summary.options[index] ?? `選択肢${index + 1}`}</span>
                      <span className="tabular-nums text-gray-700">
                        {count}票（{rate}%）
                      </span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 text-sm text-gray-500">合計 {total}票</p>
          </section>
        );
      })}
    </div>
  );
}
