/**
 * microCMS のリッチエディタが返す HTML をそのまま描画する。
 *
 * 注意: サニタイズしていない。入稿者が運営のみである前提（仕様書2章）。
 * 外部ライターに入稿権限を渡す場合は sanitize-html 等によるサニタイズの追加が必須。
 *
 * 見出しの scroll-mt は、目次から飛んだときに固定ヘッダーの下に隠れないようにするため。
 *
 * 「筆者：」「登録した表示名：」で始まる段落は吹き出しに置き換える（authorComment.ts）。
 * 吹き出しの見た目は globals.css の .author-comment にある。
 *
 * 写真が2枚以上つづく箇所は横スワイプのギャラリーに、1枚だけの写真は
 * 高さに上限をつけた表示に組み直す（photoGallery.ts）。
 * 見た目は globals.css の .photo-gallery / .article-photo にある。
 *
 * @tailwindcss/typography は未導入のため、見出し・段落のスタイルは
 * 子要素セレクタ（[&_h2]:… ）で当てている。
 */
import { renderAuthorComments } from "@/lib/microcms/authorComment";
import { renderPhotoGalleries } from "@/lib/microcms/photoGallery";

import type { Author } from "@/lib/microcms/types";

type HtmlBodyProps = {
  html: string;
  /** 吹き出しに出せる筆者。空なら「筆者：」だけが仮アイコンで吹き出しになる */
  authors?: Author[];
};

const HtmlBody: React.FC<HtmlBodyProps> = ({ html, authors = [] }) => {
  return (
    <div
      className="
        max-w-none text-[#3a332c] leading-relaxed
        [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24
        [&_h2]:font-mincho [&_h2]:text-[1.5rem] [&_h2]:leading-snug [&_h2]:font-extrabold [&_h2]:text-ink [&_h2]:mt-14 [&_h2]:mb-5 [&_h2]:pb-2.5 [&_h2]:border-b-2 [&_h2]:border-ink
        [&_h3]:font-mincho [&_h3]:text-xl [&_h3]:font-extrabold [&_h3]:text-ink [&_h3]:mt-10 [&_h3]:mb-3 [&_h3]:pb-1.5 [&_h3]:border-b [&_h3]:border-dashed [&_h3]:border-rule
        [&_p]:my-5 [&_p]:leading-[2]
        [&_a]:text-shu [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-shu-dark
        [&_ul]:my-5 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2
        [&_ol]:my-5 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2
        [&_li]:leading-[1.9]
        [&_blockquote]:my-6 [&_blockquote]:border-y [&_blockquote]:border-rule [&_blockquote]:px-2 [&_blockquote]:py-4 [&_blockquote]:font-mincho [&_blockquote]:text-ink-soft
        [&_img]:my-8 [&_img]:rounded-sm [&_img]:w-full [&_img]:h-auto
        [&_table]:my-6 [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse
        [&_th]:border [&_th]:border-rule [&_th]:bg-paper-deep [&_th]:px-3 [&_th]:py-2 [&_th]:text-left
        [&_td]:border [&_td]:border-rule [&_td]:bg-paper-card [&_td]:px-3 [&_td]:py-2
        [&_code]:bg-paper-deep [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm
      "
      dangerouslySetInnerHTML={{ __html: renderAuthorComments(renderPhotoGalleries(html), authors) }}
    />
  );
};

export default HtmlBody;
