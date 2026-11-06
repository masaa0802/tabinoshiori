/**
 * 本文の描画。
 * microCMS から来た HTML と、シードデータのブロック配列を出し分ける。
 * 実記事の入稿後は format: "html" のみになる。
 */
import type { ArticleBody as ArticleBodyType, Author } from "@/lib/microcms/types";
import HtmlBody from "./HtmlBody";
import PriceNote from "./PriceNote";

type ArticleBodyProps = {
  body: ArticleBodyType;
  /** 本文の吹き出しに出せる筆者（HtmlBody に渡す） */
  authors?: Author[];
};

const ArticleBody: React.FC<ArticleBodyProps> = ({ body, authors }) => {
  if (body.format === "html") {
    return <HtmlBody html={body.html} authors={authors} />;
  }

  return (
    <div className="max-w-none text-[#3a332c]">
      {body.blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                id={block.id}
                className="scroll-mt-24 mt-14 mb-5 border-b-2 border-ink pb-2.5 font-mincho text-[1.5rem] font-extrabold leading-snug text-ink"
              >
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={index} className="my-5 leading-[2]">
                {block.text}
              </p>
            );
          case "list":
            return (
              <ul key={index} className="my-5 pl-6 list-disc space-y-2">
                {block.items.map((item) => (
                  <li key={item} className="leading-[1.9]">
                    {item}
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="my-6 border-y border-rule px-2 py-4 font-mincho text-ink-soft"
              >
                {block.text}
              </blockquote>
            );
          case "price":
            return <PriceNote key={index} figure={block.figure} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default ArticleBody;
