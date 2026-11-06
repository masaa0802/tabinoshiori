/**
 * 記事末アンケートの票の保存先（Netlify Blobs）。
 *
 * Hasura（しおりのDB）ではなく Netlify Blobs にしたのは、
 * - 票数だけの小さなデータで、しおりのデータと結びつかない
 * - 本番DBへのマイグレーションや権限設定が要らず、デプロイだけで動く
 * ため。IPアドレスや端末の情報など、投票した人を特定できる情報は保存しない。
 *
 * 保存するもの（キーの形）:
 * - `counts/<記事>/<アンケートID>` … 選択肢ごとの合計票数と、そのときの質問文・選択肢。
 *   記事の文言をあとで変えても、管理画面で当時の質問が読めるように文言も持たせている
 * - `votes/<記事>/<アンケートID>/<時刻>-<乱数>` … 1票ずつの記録（選んだ番号と日時だけ）。
 *   推移を見たり CSV で取り出したりするため。1票1キーなので同時に書いてもぶつからない
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

const COUNTS_PREFIX = "counts/";
const VOTES_PREFIX = "votes/";

type PollSummaryRecord = {
  counts: number[];
  question?: string;
  options?: string[];
  updatedAt?: string;
};

type VoteRecord = { option: number; at: string };

export type StoreTarget = { hostname: string; isDraft: boolean };

type PollRef = StoreTarget & { slug: string; pollId: string; optionCount: number };

/** 管理画面に出す1アンケート分の集計 */
export type PollSummary = {
  slug: string;
  pollId: string;
  question: string;
  options: string[];
  counts: number[];
  updatedAt?: string;
};

/** CSV に出す1票分の記録 */
export type PollVote = { slug: string; pollId: string; option: number; at: string };

/** Blobs とメモリの差を吸収する最小限の入れ物 */
type KeyValueStore = {
  getJSON<T>(key: string): Promise<{ data: T; etag?: string } | null>;
  /** etag が null なら新規作成のみ。書けたら true */
  putJSON(key: string, data: unknown, etag: string | null): Promise<boolean>;
  keys(prefix: string): Promise<string[]>;
};

// ページと Route Handler は別々に読み込まれることがあるので、globalThis で1つにそろえる
const memoryHolder = globalThis as typeof globalThis & {
  __blogPollMemory?: Map<string, Map<string, unknown>>;
};
const memory = (memoryHolder.__blogPollMemory ??= new Map<string, Map<string, unknown>>());

function memoryStore(name: string): KeyValueStore {
  const map = memory.get(name) ?? new Map<string, unknown>();
  memory.set(name, map);
  return {
    async getJSON<T>(key: string) {
      return map.has(key) ? { data: map.get(key) as T, etag: "memory" } : null;
    },
    async putJSON(key, data) {
      map.set(key, data);
      return true;
    },
    async keys(prefix) {
      return [...map.keys()].filter((key) => key.startsWith(prefix));
    },
  };
}

function blobStore(store: ReturnType<typeof getStore>): KeyValueStore {
  return {
    async getJSON<T>(key: string) {
      const result = await store.getWithMetadata(key, { type: "json" });
      return result ? { data: result.data as T, etag: result.etag } : null;
    },
    async putJSON(key, data, etag) {
      const result = etag
        ? await store.setJSON(key, data, { onlyIfMatch: etag })
        : await store.setJSON(key, data, { onlyIfNew: true });
      return result.modified;
    },
    async keys(prefix) {
      const keys: string[] = [];
      for await (const page of store.list({ prefix, paginate: true })) {
        keys.push(...page.blobs.map((blob) => blob.key));
      }
      return keys;
    },
  };
}

function storeNameFor({ hostname, isDraft }: StoreTarget): string {
  return PRODUCTION_HOSTS.has(hostname) && !isDraft ? "blog-polls" : "blog-polls-preview";
}

function openStore(target: StoreTarget): KeyValueStore {
  const name = storeNameFor(target);
  try {
    return blobStore(getStore({ name, consistency: "strong" }));
  } catch {
    // Netlify の外では環境情報が無く例外になる
    return memoryStore(name);
  }
}

const countsKey = (slug: string, pollId: string) => `${COUNTS_PREFIX}${slug}/${pollId}`;

/** 保存値を選択肢の数にそろえる（壊れた値・足りない分は0票として扱う） */
function normalize(record: unknown, optionCount: number): number[] {
  const counts =
    record && typeof record === "object" && Array.isArray((record as PollSummaryRecord).counts)
      ? (record as PollSummaryRecord).counts
      : [];
  return Array.from({ length: optionCount }, (_, index) => {
    const value = counts[index];
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  });
}

export async function readPollCounts(ref: PollRef): Promise<number[]> {
  const current = await openStore(ref).getJSON<PollSummaryRecord>(countsKey(ref.slug, ref.pollId));
  return normalize(current?.data, ref.optionCount);
}

/** 1票足して、足したあとの票数を返す */
export async function addPollVote(
  ref: PollRef & { option: number; question: string; options: string[] }
): Promise<number[]> {
  const { slug, pollId, optionCount, option, question, options } = ref;
  const store = openStore(ref);
  const at = new Date().toISOString();

  // 1票ずつの記録。キーに時刻を入れておくと一覧が時系列にそろう
  const random = Math.random().toString(36).slice(2, 10);
  const vote: VoteRecord = { option, at };
  await store.putJSON(`${VOTES_PREFIX}${slug}/${pollId}/${at}-${random}`, vote, null);

  // 合計。読んでから書くまでのあいだに他の人の票が入ったら、読み直してやり直す
  const key = countsKey(slug, pollId);
  for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
    const current = await store.getJSON<PollSummaryRecord>(key);
    const counts = normalize(current?.data, optionCount);
    counts[option] += 1;
    const record: PollSummaryRecord = { counts, question, options, updatedAt: at };
    if (await store.putJSON(key, record, current?.etag ?? null)) return counts;
  }
  throw new Error("投票の保存が混み合って失敗しました");
}

/** 管理画面用。保存されているすべてのアンケートの集計 */
export async function listPollSummaries(target: StoreTarget): Promise<PollSummary[]> {
  const store = openStore(target);
  const keys = await store.keys(COUNTS_PREFIX);
  const summaries = await Promise.all(
    keys.map(async (key): Promise<PollSummary | null> => {
      const [slug, pollId] = key.slice(COUNTS_PREFIX.length).split("/");
      const record = (await store.getJSON<PollSummaryRecord>(key))?.data;
      if (!slug || !pollId || !record) return null;
      const options = Array.isArray(record.options) ? record.options : [];
      const optionCount = Math.max(options.length, record.counts?.length ?? 0);
      return {
        slug,
        pollId,
        question: record.question ?? "",
        options,
        counts: normalize(record, optionCount),
        updatedAt: record.updatedAt,
      };
    })
  );
  return summaries
    .filter((summary): summary is PollSummary => summary !== null)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

/** 管理画面の CSV 用。1票ずつの記録を古い順に */
export async function listPollVotes(target: StoreTarget): Promise<PollVote[]> {
  const store = openStore(target);
  const keys = await store.keys(VOTES_PREFIX);
  const votes = await Promise.all(
    keys.map(async (key): Promise<PollVote | null> => {
      const [slug, pollId] = key.slice(VOTES_PREFIX.length).split("/");
      const record = (await store.getJSON<VoteRecord>(key))?.data;
      if (!slug || !pollId || !record || typeof record.option !== "number") return null;
      return { slug, pollId, option: record.option, at: record.at };
    })
  );
  return votes
    .filter((vote): vote is PollVote => vote !== null)
    .sort((a, b) => a.at.localeCompare(b.at));
}
