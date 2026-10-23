/**
 * microCMS のリッチエディタが返す HTML をそのまま描画する。
 *
 * 注意: サニタイズしていない。入稿者が運営のみである前提（仕様書2章）。
 * 外部ライターに入稿権限を渡す場合は sanitize-html 等によるサニタイズの追加が必須。
 *
 * 見出しの scroll-mt は、目次から飛んだときに固定ヘッダーの下に隠れないようにするため。
 *
 * @tailwindcss/typography は未導入のため、見出し・段落のスタイルは
 * 子要素セレクタ（[&_h2]:… ）で当てている。
 */
type HtmlBodyProps = {
  html: string;
};

const HtmlBody: React.FC<HtmlBodyProps> = ({ html }) => {
  return (
    <div
      className="
        max-w-none text-gray-700 leading-relaxed
        [&_h2]:scroll-mt-24 [&_h3]:scroll-mt-24
        [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-gray-200
        [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-8 [&_h3]:mb-3
        [&_p]:my-5 [&_p]:leading-[1.9]
        [&_a]:text-emerald-700 [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-emerald-800
        [&_ul]:my-5 [&_ul]:pl-6 [&_ul]:list-disc [&_ul]:space-y-2
        [&_ol]:my-5 [&_ol]:pl-6 [&_ol]:list-decimal [&_ol]:space-y-2
        [&_li]:leading-[1.9]
        [&_blockquote]:my-6 [&_blockquote]:border-l-4 [&_blockquote]:border-emerald-400 [&_blockquote]:bg-emerald-50/60 [&_blockquote]:px-5 [&_blockquote]:py-4 [&_blockquote]:rounded-r-lg [&_blockquote]:text-gray-700
        [&_img]:my-8 [&_img]:rounded-xl [&_img]:w-full [&_img]:h-auto
        [&_table]:my-6 [&_table]:w-full [&_table]:text-sm [&_table]:border-collapse
        [&_th]:border [&_th]:border-gray-200 [&_th]:bg-gray-50 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left
        [&_td]:border [&_td]:border-gray-200 [&_td]:px-3 [&_td]:py-2
        [&_code]:bg-gray-100 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm
      "
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default HtmlBody;
