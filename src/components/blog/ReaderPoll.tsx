"use client";

/**
 * 記事末の読者アンケート（4択など）。
 *
 * - 匿名。名前やメールアドレスは聞かず、投票した人を特定する情報も送らない
 * - 結果（各選択肢の割合）は投票したあとにだけ見せる。先に見せると多い方に流れるため
 * - 同じブラウザからの2回目以降は、選んだ選択肢を覚えておいて結果だけを出す（localStorage）
 *
 * 質問と選択肢は本文の「アンケート：」から取り出している（lib/microcms/poll.ts）。
 */
import { useEffect, useState } from "react";
import type { ReaderPoll as ReaderPollData } from "@/lib/microcms/poll";
import { trackPollVote } from "@/lib/blog-analytics";

type Props = {
  slug: string;
  poll: ReaderPollData;
  /** microCMS の下書きプレビューのときだけ渡す。下書きの本文でアンケートを確かめるため */
  draftKey?: string;
};

type Status = "idle" | "sending" | "voted" | "error";

function storageKey(slug: string, pollId: string): string {
  return `tabinoshiori:poll:${slug}:${pollId}`;
}

/** localStorage はプライベートモードなどで例外を投げることがある */
function readVote(key: string, optionCount: number): number | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isInteger(value) && value >= 0 && value < optionCount ? value : null;
  } catch {
    return null;
  }
}

function saveVote(key: string, option: number): void {
  try {
    window.localStorage.setItem(key, String(option));
  } catch {
    // 覚えておけなくても、次に開いたときにもう一度選べるだけ
  }
}

function percentages(counts: number[]): number[] {
  const total = counts.reduce((sum, value) => sum + value, 0);
  if (total === 0) return counts.map(() => 0);
  return counts.map((value) => Math.round((value / total) * 100));
}

export default function ReaderPoll({ slug, poll, draftKey }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [chosen, setChosen] = useState<number | null>(null);
  const [counts, setCounts] = useState<number[] | null>(null);
  // 下書きで試した投票を、公開後の本番の記事で「投票済み」にしない
  const key = `${storageKey(slug, poll.id)}${draftKey ? ":draft" : ""}`;

  // 投票済みなら結果を取りにいく
  useEffect(() => {
    const previous = readVote(key, poll.options.length);
    if (previous === null) return;
    setChosen(previous);
    setStatus("voted");
    const query = new URLSearchParams({ slug, pollId: poll.id });
    if (draftKey) query.set("draftKey", draftKey);
    fetch(`/api/blog/poll?${query}`, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { counts?: number[] } | null) => {
        if (data?.counts) setCounts(data.counts);
      })
      .catch(() => {
        // 結果が取れなくても、選んだ選択肢は表示できる
      });
  }, [key, slug, poll.id, poll.options.length, draftKey]);

  const vote = async (option: number) => {
    if (status === "sending" || status === "voted") return;
    setStatus("sending");
    setChosen(option);
    try {
      const response = await fetch("/api/blog/poll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pollId: poll.id, option, draftKey }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { counts?: number[] };
      setCounts(data.counts ?? null);
      setStatus("voted");
      saveVote(key, option);
      if (!draftKey) trackPollVote({ slug, pollId: poll.id, option });
    } catch {
      setChosen(null);
      setStatus("error");
    }
  };

  const total = counts?.reduce((sum, value) => sum + value, 0) ?? 0;
  const rates = counts ? percentages(counts) : null;
  const showResults = status === "voted";

  return (
    <section
      aria-labelledby="reader-poll-question"
      className="relative mt-14 rounded-md border border-rule bg-paper-card p-6 shadow-[0_1px_0_var(--color-rule)] sm:p-8"
    >
      <span
        aria-hidden="true"
        className="absolute -top-2.5 right-8 h-5 w-20 rotate-3 bg-[rgba(194,170,120,0.55)]"
      />
      <p className="font-hand text-[15px] text-shu">読者アンケート</p>
      <h2
        id="reader-poll-question"
        className="mt-1 font-mincho text-xl font-extrabold leading-snug text-ink sm:text-2xl"
      >
        {poll.question}
      </h2>

      {showResults ? (
        <ul className="mt-6 space-y-3" aria-live="polite">
          {poll.options.map((option, index) => {
            const rate = rates?.[index] ?? 0;
            const isChosen = index === chosen;
            return (
              <li key={option} className="relative overflow-hidden rounded border border-rule bg-paper">
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 left-0 transition-[width] duration-700 ${
                    isChosen ? "bg-shu/20" : "bg-paper-deep"
                  }`}
                  style={{ width: rates ? `${rate}%` : "0%" }}
                />
                <span className="relative flex items-center justify-between gap-3 px-4 py-3 text-[15px]">
                  <span className={isChosen ? "font-bold text-ink" : "text-ink-soft"}>
                    {option}
                    {isChosen && (
                      <span className="ml-2 inline-block -rotate-2 border border-shu px-1.5 text-[11px] font-bold text-shu">
                        あなたの回答
                      </span>
                    )}
                  </span>
                  {rates && (
                    <span className="shrink-0 font-mincho text-base font-bold tabular-nums text-ink">
                      {rate}%
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 grid gap-3">
          {poll.options.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => vote(index)}
              disabled={status === "sending"}
              className={`rounded border px-4 py-3 text-left text-[15px] leading-relaxed transition-colors disabled:cursor-wait ${
                status === "sending" && chosen === index
                  ? "border-shu bg-shu/10 text-ink"
                  : "border-rule bg-paper text-ink-soft hover:border-shu hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        {status === "error"
          ? "うまく送れませんでした。時間をおいてもう一度お試しください。"
          : showResults
            ? counts
              ? `${total.toLocaleString("ja-JP")}票（ご回答ありがとうございました）`
              : "ご回答ありがとうございました。"
            : "匿名の投票です。選ぶとみんなの回答の割合が見られます。"}
      </p>
    </section>
  );
}
