/**
 * 記事末アンケートの票の保存先（Netlify Blobs）。
 *
 * Hasura（しおりのDB）ではなく Netlify Blobs にしたのは、
 * - 票数だけの小さなデータで、しおりのデータと結びつかない
 * - 本番DBへのマイグレーションや権限設定が要らず、デプロイだけで動く
 * ため。保存するのは記事ごと・アンケートごとの選択肢別の票数だけで、
 * IPアドレスや端末の情報など、投票した人を特定できる情報は保存しない。
 *
 * 本番（tabinoshiori.jp）とそれ以外（デプロイプレビューなど）でストアを分けている。
 * プレビューで試しに押した票が本番の結果に混ざらないようにするため。
 * microCMS の下書きプレビュー（draftKey 付き）は、本番のドメインで開いてもプレビュー側に入れる。
 *
 * Netlify の外（ローカルの npm run dev）では Blobs が使えないので、
 * プロセス内のメモリに保存する（再起動で消える。動作確認用）。
 */
import "server-only";
import { getStore } from "@netlify/blobs";

const PRODUCTION_HOSTS = new Set(["tabinoshiori.jp", "www.tabinoshiori.jp"]);

/** 同時に投票されて書き込みがぶつかったときに読み直す回数 */
const MAX_WRITE_ATTEMPTS = 5;

type PollRecord = { counts: number[] };

type BlobStore = ReturnType<typeof getStore>;

const memoryStore = new Map<string, PollRecord>();

type StoreTarget = { hostname: string; isDraft: boolean };

function storeNameFor({ hostname, isDraft }: StoreTarget): string {
  return PRODUCTION_HOSTS.has(hostname) && !isDraft ? "blog-polls" : "blog-polls-preview";
}

function openStore(target: StoreTarget): BlobStore | null {
  try {
    return getStore({ name: storeNameFor(target), consistency: "strong" });
  } catch {
    // Netlify の外では環境情報が無く例外になる
    return null;
  }
}

function keyOf(slug: string, pollId: string): string {
  return `${slug}/${pollId}`;
}

/** 保存値を選択肢の数にそろえる（壊れた値・足りない分は0票として扱う） */
function normalize(record: unknown, optionCount: number): number[] {
  const counts =
    record && typeof record === "object" && Array.isArray((record as PollRecord).counts)
      ? (record as PollRecord).counts
      : [];
  return Array.from({ length: optionCount }, (_, index) => {
    const value = counts[index];
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  });
}

export async function readPollCounts(params: {
  hostname: string;
  isDraft: boolean;
  slug: string;
  pollId: string;
  optionCount: number;
}): Promise<number[]> {
  const { hostname, isDraft, slug, pollId, optionCount } = params;
  const key = keyOf(slug, pollId);
  const store = openStore({ hostname, isDraft });
  if (!store) return normalize(memoryStore.get(key), optionCount);
  return normalize(await store.get(key, { type: "json" }), optionCount);
}

/** 1票足して、足したあとの票数を返す */
export async function addPollVote(params: {
  hostname: string;
  isDraft: boolean;
  slug: string;
  pollId: string;
  optionCount: number;
  option: number;
}): Promise<number[]> {
  const { hostname, isDraft, slug, pollId, optionCount, option } = params;
  const key = keyOf(slug, pollId);
  const store = openStore({ hostname, isDraft });

  if (!store) {
    const counts = normalize(memoryStore.get(key), optionCount);
    counts[option] += 1;
    memoryStore.set(key, { counts });
    return counts;
  }

  // 読んでから書くまでのあいだに他の人の票が入ったら、読み直してやり直す
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const current = await store.getWithMetadata(key, { type: "json" });
    const counts = normalize(current?.data, optionCount);
    counts[option] += 1;
    const result = current
      ? await store.setJSON(key, { counts }, { onlyIfMatch: current.etag })
      : await store.setJSON(key, { counts }, { onlyIfNew: true });
    if (result.modified) return counts;
  }
  throw new Error("投票の保存が混み合って失敗しました");
}
