/**
 * 本文の描画。
 * microCMS から来た HTML と、シードデータのブロック配列を出し分ける。
 * 実記事の入稿後は format: "html" のみになる。
 */
import type { ArticleBody as ArticleBodyType } from "@/lib/microcms/types";
import HtmlBody from "./HtmlBody";
import PriceNote from "./PriceNote";

type ArticleBodyProps = {
  body: ArticleBodyType;
};

const ArticleBody: React.FC<ArticleBodyProps> = ({ body }) => {
  if (body.format === "html") {
    return <HtmlBody html={body.html} />;
  }

  return (
    <div className="max-w-none text-gray-700">
      {body.blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                id={block.id}
                className="scroll-mt-24 text-2xl font-bold text-gray-900 mt-12 mb-4 pb-2 border-b border-gray-200"
              >
                {block.text}
              </h2>
            );
          case "paragraph":
            return (
              <p key={index} className="my-5 leading-[1.9]">
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
                className="my-6 border-l-4 border-emerald-400 bg-emerald-50/60 px-5 py-4 rounded-r-lg text-gray-700"
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
