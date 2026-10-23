/**
 * 本文の見出し（h2・h3）から目次を作る。
 *
 * 目次のリンク先になるよう、見出しに id を付けた本文もあわせて返す。
 * microCMS のリッチエディタは見出しに id を付けて返すことがあるので、
 * すでに id があればそれを使い、無いものにだけ `toc-<番号>` を付ける。
 *
 * HTML は正規表現で扱っている。入稿者が運営のみで、リッチエディタの出力形式が
 * 決まっている前提（HtmlBody.tsx と同じ）。外部の HTML を通す用途には使わないこと。
 */
import type { ArticleBody, ArticleBlock } from "./types";

export type TocItem = {
  id: string;
  text: string;
  level: 2 | 3;
};

const HEADING_PATTERN = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;
const ID_ATTRIBUTE_PATTERN = /\sid\s*=\s*"([^"]*)"/i;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** 見出しの中身からタグを除き、目次に出す文字列にする */
function toPlainText(innerHtml: string): string {
  return innerHtml
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (entity) => ENTITIES[entity] ?? entity)
    .replace(/\s+/g, " ")
    .trim();
}

function buildHtmlToc(html: string): { html: string; items: TocItem[] } {
  const items: TocItem[] = [];

  const withIds = html.replace(
    HEADING_PATTERN,
    (whole, level: string, attributes: string | undefined, inner: string) => {
      const text = toPlainText(inner);
      if (!text) return whole;

      const existingId = attributes?.match(ID_ATTRIBUTE_PATTERN)?.[1];
      const id = existingId || `toc-${items.length + 1}`;
      items.push({ id, text, level: level === "2" ? 2 : 3 });

      if (existingId) return whole;
      // id="" のような空の属性が付いていたら、重複しないよう外してから付け直す
      const rest = (attributes ?? "").replace(ID_ATTRIBUTE_PATTERN, "");
      return `<h${level}${rest} id="${id}">${inner}</h${level}>`;
    }
  );

  return { html: withIds, items };
}

function buildBlocksToc(blocks: ArticleBlock[]): {
  blocks: ArticleBlock[];
  items: TocItem[];
} {
  const items: TocItem[] = [];
  const withIds = blocks.map((block) => {
    if (block.type !== "heading") return block;
    const id = `toc-${items.length + 1}`;
    items.push({ id, text: block.text, level: 2 });
    return { ...block, id };
  });
  return { blocks: withIds, items };
}

export function buildToc(body: ArticleBody): { body: ArticleBody; items: TocItem[] } {
  if (body.format === "html") {
    const { html, items } = buildHtmlToc(body.html);
    return { body: { format: "html", html }, items };
  }
  const { blocks, items } = buildBlocksToc(body.blocks);
  return { body: { format: "blocks", blocks }, items };
}
