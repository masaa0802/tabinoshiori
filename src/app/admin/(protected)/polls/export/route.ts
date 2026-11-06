/**
 * 管理画面: 読者アンケートの1票ずつの記録を CSV で返す。
 * /admin 配下なので middleware.ts のログイン確認を通った人だけが取れる。
 *
 * 列: 日時（日本時間）, 記事, アンケートID, 質問, 選択肢番号, 選択肢
 * Excel で文字化けしないよう、先頭に BOM を付けている。
 */
import { listPollSummaries, listPollVotes } from "@/lib/pollStore";
import { isAdminSession } from "@/lib/admin/session";

export const dynamic = "force-dynamic";

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toJst(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Tokyo" });
}

export async function GET(request: Request) {
  if (!(await isAdminSession())) {
    return new Response("Unauthorized", { status: 401, headers: { "Cache-Control": "no-store" } });
  }
  const target = { hostname: new URL(request.url).hostname, isDraft: false };
  const [votes, summaries] = await Promise.all([listPollVotes(target), listPollSummaries(target)]);
  const polls = new Map(summaries.map((summary) => [`${summary.slug}/${summary.pollId}`, summary]));

  const rows = [
    ["日時", "記事", "アンケートID", "質問", "選択肢番号", "選択肢"],
    ...votes.map((vote) => {
      const poll = polls.get(`${vote.slug}/${vote.pollId}`);
      return [
        toJst(vote.at),
        vote.slug,
        vote.pollId,
        poll?.question ?? "",
        vote.option + 1,
        poll?.options[vote.option] ?? "",
      ];
    }),
  ];
  const csv = "﻿" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="blog-polls-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
