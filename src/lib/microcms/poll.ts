/**
 * 本文の「アンケート：」の段落と、その直後の箇条書きを、記事末の読者アンケートとして取り出す。
 *
 * microCMS のリッチエディタ（CSV の body 列でも同じ）で次のように書く。
 *
 *   <p>アンケート：この件どう思う？</p>
 *   <ul><li>選択肢1</li><li>選択肢2</li><li>選択肢3</li><li>選択肢4</li></ul>
 *
 * - 「アンケート：」の後ろが質問文。空なら「この件どう思う？」になる
 * - 直後の箇条書き（番号つきでもよい）の各行が選択肢。2〜6個
 * - 1記事に1つだけ。2つ目以降は普通の段落・箇条書きのまま出る
 * - 取り出した部分は本文から消し、記事末にアンケートとして出す
 *
 * 条件を満たさないとき（選択肢が1つだけ・7個以上など）は本文に手を付けない。
 * 置き換えに失敗しても、質問と箇条書きが普通の文章として読めるようにするため。
 *
 * サーバー（記事ページ・投票API）とブラウザの両方から使うので server-only にしない。
 */

export const DEFAULT_POLL_QUESTION = "この件どう思う？";
export const MIN_POLL_OPTIONS = 2;
export const MAX_POLL_OPTIONS = 6;

export type ReaderPoll = {
  /** 質問文と選択肢から作る識別子。文言を変えると別のアンケートとして数え直しになる */
  id: string;
  question: string;
  options: string[];
};

const SPACE = "(?:\\s|&nbsp;|\\u00a0|\\u200b|\\ufeff)*";
const INLINE_OPEN = `(?:<(?:strong|b|span|em)(?:\\s[^>]*)?>${SPACE})*`;
const INLINE_CLOSE = `(?:</(?:strong|b|span|em)>${SPACE})*`;

const POLL_BLOCK = new RegExp(
  `<p(?:\\s[^>]*)?>${SPACE}${INLINE_OPEN}アンケート${SPACE}[：:︰]${SPACE}${INLINE_CLOSE}([\\s\\S]*?)</p>` +
    // 質問と箇条書きのあいだの空段落（リッチエディタで改行を重ねると入る）は読み飛ばす
    `(?:${SPACE}<p(?:\\s[^>]*)?>(?:${SPACE}|<br\\s*/?>)*</p>)*${SPACE}` +
    `<(ul|ol)(?:\\s[^>]*)?>([\\s\\S]*?)</\\2>`,
  "i"
);

const LIST_ITEM = /<li(?:\s[^>]*)?>([\s\S]*?)<\/li>/gi;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** タグを外して素の文字列にする。表示は React がエスケープするので、ここでは戻すだけ */
function toPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity])
    .replace(/[ ​﻿]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** 32bit FNV-1a。暗号用途ではなく、文言が同じなら同じIDになればよい */
function hash(value: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

export function pollIdOf(question: string, options: string[]): string {
  return hash([question, ...options].join("\n"));
}

/** 本文からアンケートを取り出す。無ければ poll は null で、html はそのまま */
export function extractPoll(html: string): { html: string; poll: ReaderPoll | null } {
  const match = html.match(POLL_BLOCK);
  if (!match || match.index === undefined) return { html, poll: null };

  const [whole, rawQuestion, , rawItems] = match;
  const options = [...rawItems.matchAll(LIST_ITEM)]
    .map((item) => toPlainText(item[1]))
    .filter((text) => text.length > 0);

  if (options.length < MIN_POLL_OPTIONS || options.length > MAX_POLL_OPTIONS) {
    return { html, poll: null };
  }

  const question = toPlainText(rawQuestion) || DEFAULT_POLL_QUESTION;
  return {
    html: html.slice(0, match.index) + html.slice(match.index + whole.length),
    poll: { id: pollIdOf(question, options), question, options },
  };
}
