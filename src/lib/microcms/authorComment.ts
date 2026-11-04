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

export function renderAuthorComments(html: string, authors: Author[] = []): string {
  const speakers = buildSpeakerMap(authors);

  // 長い名前から試す。「後藤」と「後藤さん」が両方いても正しく拾うため
  const names = [...speakers.keys()].sort((a, b) => b.length - a.length).map(escapeRegExp);

  // <p>名前：本文</p>。全角・半角のコロンどちらでもよい。
  // 先頭に <strong> などが挟まっても拾えるよう、開きタグは読み飛ばす
  const pattern = new RegExp(
    `<p(?:\\s[^>]*)?>\\s*((?:<(?:strong|b|span)(?:\\s[^>]*)?>\\s*)*)(${names.join("|")})\\s*[：:]\\s*((?:</(?:strong|b|span)>\\s*)*)([\\s\\S]*?)</p>`,
    "g"
  );

  return html.replace(
    pattern,
    (whole, openTags: string, name: string, closeTags: string, inner: string) => {
      const speaker = speakers.get(name);
      // 「名前：」だけを太字にしていた場合は、開き・閉じタグを両方捨てる。
      // 段落全体を太字にしていた場合は、閉じタグが本文側に残るので開きタグを戻す
      const prefix = closeTags ? "" : openTags;
      const text = `${prefix}${inner}`.trim();
      if (!speaker || !text) return whole;
      return renderBubble(speaker, text);
    }
  );
}
