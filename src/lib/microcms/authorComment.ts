/**
 * 本文中の「名前：」で始まる段落を、その人のアイコンつきの吹き出しに置き換える。
 *
 * microCMS のリッチエディタで、段落の先頭に次のどちらかを書くと吹き出しになる。
 * - 「筆者：」… 筆者一覧（authors API）で「筆者：」で使う人に設定した人
 * - 「表示名：」… 筆者一覧に登録した人の表示名（ゲストの寄稿者や同行者など）
 *
 * 登録していない名前は置き換えない。「注意：」のような普通の段落を
 * 誤って吹き出しにしないため。置き換えに失敗しても「筆者：〜」という
 * 普通の段落として読めるよう、目印は文章として自然な形にしている。
 *
 * HTML は正規表現で扱っている。前提は toc.ts と同じ（入稿者が運営のみ）。
 */
import type { Author } from "./types";
import { optimizedImageUrl } from "./format";

/** アイコン未設定の人と、筆者一覧が空のときに使う仮アイコン */
export const DEFAULT_AUTHOR_ICON_PATH = "/images/blog/author-icon.svg";

/** 本文で「既定の筆者」を指す目印 */
export const DEFAULT_AUTHOR_MARKER = "筆者";

type Speaker = { name: string; iconUrl: string };

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ENTITIES[char]);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toSpeaker(author: Author): Speaker {
  return {
    name: author.name,
    // 表示は 56px。高解像度の画面向けに倍の幅で取る
    iconUrl: author.icon ? optimizedImageUrl(author.icon.url, 112) : DEFAULT_AUTHOR_ICON_PATH,
  };
}

/**
 * 「筆者：」で使う人。isDefault の人、いなければ一覧の先頭。
 * 一覧が空なら「筆者」という名前の仮の人にする。
 */
function defaultSpeaker(authors: Author[]): Speaker {
  const author = authors.find((item) => item.isDefault) ?? authors[0];
  return author
    ? toSpeaker(author)
    : { name: DEFAULT_AUTHOR_MARKER, iconUrl: DEFAULT_AUTHOR_ICON_PATH };
}

/** 目印の名前 → 吹き出しに出す人 */
function buildSpeakerMap(authors: Author[]): Map<string, Speaker> {
  const speakers = new Map<string, Speaker>();
  for (const author of authors) {
    // 同じ表示名が2人いたら先に登録された方を使う
    if (!speakers.has(author.name)) speakers.set(author.name, toSpeaker(author));
  }
  // 「筆者」という表示名の人が登録されていても、「筆者：」は既定の筆者を指す
  speakers.set(DEFAULT_AUTHOR_MARKER, defaultSpeaker(authors));
  return speakers;
}

function renderBubble(speaker: Speaker, text: string): string {
  const name = escapeHtml(speaker.name);
  return (
    `<div class="author-comment">` +
    `<figure class="author-comment__avatar">` +
    `<img src="${escapeHtml(speaker.iconUrl)}" alt="" width="56" height="56" loading="lazy">` +
    `<figcaption>${name}</figcaption>` +
    `</figure>` +
    `<div class="author-comment__bubble"><p>${text}</p></div>` +
    `</div>`
  );
}

// 空白とみなす文字。リッチエディタへの貼り付けで &nbsp; やゼロ幅スペースが混ざることがある
const SPACE = "(?:\\s|&nbsp;|\\u00a0|\\u200b|\\ufeff)*";

// 段落の中の改行（Shift+Enter で入る <br>）。連続した <br> はまとめて1つの区切りとみなす
const LINE_BREAK = /((?:\s*<br\s*\/?>\s*)+)/i;

const PARAGRAPH = /<p(\s[^>]*)?>([\s\S]*?)<\/p>/gi;

/**
 * 段落を吹き出しに置き換える。
 *
 * 「名前：」は段落の先頭だけでなく、段落の中の改行（<br>）の直後でも拾う。
 * リッチエディタで Shift+Enter で改行すると、見た目は別の段落でも
 * HTML 上は同じ <p> の中に <br> 区切りで入るため。
 * その場合は段落を分けて、吹き出しの前後を普通の段落として残す。
 */
export function renderAuthorComments(html: string, authors: Author[] = []): string {
  const speakers = buildSpeakerMap(authors);

  // 長い名前から試す。「後藤」と「後藤さん」が両方いても正しく拾うため
  const names = [...speakers.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);

  // 行の先頭の「名前：」。全角・半角のコロンどちらでもよい。
  // 先頭に <strong> などが挟まっても拾えるよう、開きタグは読み飛ばす
  const marker = new RegExp(
    `^${SPACE}((?:<(?:strong|b|span)(?:\\s[^>]*)?>${SPACE})*)(${names.join("|")})${SPACE}[：:︰]${SPACE}((?:</(?:strong|b|span)>${SPACE})*)([\\s\\S]*)$`
  );

  /** 1行ぶんの HTML が「名前：」で始まっていれば吹き出しにする。違えば null */
  const toBubble = (line: string): string | null => {
    const match = line.match(marker);
    if (!match) return null;
    const [, openTags, name, closeTags, inner] = match;
    const speaker = speakers.get(name);
    // 「名前：」だけを太字にしていた場合は、開き・閉じタグを両方捨てる。
    // 段落全体を太字にしていた場合は、閉じタグが本文側に残るので開きタグを戻す
    const prefix = closeTags ? "" : openTags;
    const text = `${prefix}${inner}`.trim();
    if (!speaker || !text) return null;
    return renderBubble(speaker, text);
  };

  return html.replace(PARAGRAPH, (whole, attributes: string | undefined, inner: string) => {
    // split にキャプチャを付けているので、[行, 区切り, 行, 区切り, 行…] の順に並ぶ
    const parts = inner.split(LINE_BREAK);
    const output: string[] = [];
    let pending = "";
    let replaced = false;

    const flush = () => {
      if (pending.trim()) output.push(`<p${attributes ?? ""}>${pending}</p>`);
      pending = "";
    };

    for (let index = 0; index < parts.length; index += 2) {
      const line = parts[index];
      const separator = index > 0 ? parts[index - 1] : "";
      const bubble = toBubble(line);
      if (bubble) {
        flush();
        output.push(bubble);
        replaced = true;
      } else {
        pending += pending ? `${separator}${line}` : line;
      }
    }

    if (!replaced) return whole;
    flush();
    return output.join("");
  });
}
