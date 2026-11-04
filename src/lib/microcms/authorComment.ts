/**
 * 本文中の「筆者：」で始まる段落を、筆者アイコンつきの吹き出しに置き換える。
 *
 * microCMS のリッチエディタで、段落の先頭に「筆者：」と書くだけで吹き出しになる。
 * 置き換えに失敗しても「筆者：〜」という普通の段落として読めるよう、
 * 目印は文章として自然な形にしている。
 *
 * HTML は正規表現で扱っている。前提は toc.ts と同じ（入稿者が運営のみ）。
 */

/** 筆者アイコン。差し替えるときはこのファイルを置き換える */
export const AUTHOR_ICON_PATH = "/images/blog/author-icon.svg";

export const AUTHOR_LABEL = "筆者";

// <p>筆者：本文</p>。全角・半角のコロンどちらでもよい。
// 先頭に <strong> などが挟まっても拾えるよう、開きタグは読み飛ばす
const AUTHOR_PARAGRAPH_PATTERN =
  /<p(?:\s[^>]*)?>\s*((?:<(?:strong|b|span)(?:\s[^>]*)?>\s*)*)筆者\s*[：:]\s*((?:<\/(?:strong|b|span)>\s*)*)([\s\S]*?)<\/p>/g;

export function renderAuthorComments(html: string): string {
  return html.replace(
    AUTHOR_PARAGRAPH_PATTERN,
    (whole, openTags: string, closeTags: string, inner: string) => {
      // 「筆者：」だけを太字にしていた場合は、開き・閉じタグを両方捨てる。
      // 段落全体を太字にしていた場合は、閉じタグが本文側に残るので開きタグを戻す
      const prefix = closeTags ? "" : openTags;
      const text = `${prefix}${inner}`.trim();
      if (!text) return whole;

      return (
        `<div class="author-comment">` +
        `<figure class="author-comment__avatar">` +
        `<img src="${AUTHOR_ICON_PATH}" alt="" width="56" height="56" loading="lazy">` +
        `<figcaption>${AUTHOR_LABEL}</figcaption>` +
        `</figure>` +
        `<div class="author-comment__bubble"><p>${text}</p></div>` +
        `</div>`
      );
    }
  );
}
