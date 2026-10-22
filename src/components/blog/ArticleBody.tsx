/**
 * 本文の描画。
 * microCMS から来た HTML と、シードデータのブロック配列を出し分ける。
 * 実記事の入稿後は format: "html" のみになる。
 */
import type {
  ArticleBlock,
  ArticleBody as ArticleBodyType,
} from "@/lib/microcms/types";
import HtmlBody from "./HtmlBody";
import PriceNote from "./PriceNote";

type ArticleBodyProps = {
  body: ArticleBodyType;
  /**
   * 本文の途中に差し込む要素（記事中の広告枠）。
   * 見出し（h2）が3つ以上ある記事だけ、2つ目の見出しの直前に入れる。
   * 1つ目の節を読み終えた区切りなので読書を遮りにくい。
   * 見出しが少ない短い記事では、末尾の広告と近づきすぎるので入れない。
   */
  midContent?: React.ReactNode;
};

const MIN_HEADINGS_FOR_MID = 3;
const MID_BEFORE_HEADING_INDEX = 1;

/** 2つ目の h2 の位置で HTML を前後に分ける。条件を満たさなければ null */
function splitHtmlForMid(html: string): [string, string] | null {
  const positions = Array.from(html.matchAll(/<h2[\s>]/gi), (m) => m.index);
  if (positions.length < MIN_HEADINGS_FOR_MID) return null;
  const at = positions[MID_BEFORE_HEADING_INDEX];
  return [html.slice(0, at), html.slice(at)];
}

/** 2つ目の見出しブロックの位置で配列を前後に分ける。条件を満たさなければ null */
function splitBlocksForMid(
  blocks: ArticleBlock[]
): [ArticleBlock[], ArticleBlock[]] | null {
  const positions = blocks.flatMap((block, index) =>
    block.type === "heading" ? [index] : []
  );
  if (positions.length < MIN_HEADINGS_FOR_MID) return null;
  const at = positions[MID_BEFORE_HEADING_INDEX];
  return [blocks.slice(0, at), blocks.slice(at)];
}

const ArticleBody: React.FC<ArticleBodyProps> = ({ body, midContent }) => {
  if (body.format === "html") {
    const parts = midContent ? splitHtmlForMid(body.html) : null;
    if (!parts) return <HtmlBody html={body.html} />;

    return (
      <>
        <HtmlBody html={parts[0]} />
        {midContent}
        <HtmlBody html={parts[1]} />
      </>
    );
  }

  const parts = midContent ? splitBlocksForMid(body.blocks) : null;
  if (!parts) return <BlockBody blocks={body.blocks} />;

  return (
    <>
      <BlockBody blocks={parts[0]} />
      {midContent}
      <BlockBody blocks={parts[1]} />
    </>
  );
};

const BlockBody: React.FC<{ blocks: ArticleBlock[] }> = ({ blocks }) => {
  return (
    <div className="max-w-none text-gray-700">
      {blocks.map((block, index) => {
        switch (block.type) {
          case "heading":
            return (
              <h2
                key={index}
                className="text-2xl font-bold text-gray-900 mt-12 mb-4 pb-2 border-b border-gray-200"
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
