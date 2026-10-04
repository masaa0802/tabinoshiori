import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/microcms/queries";
import { BLOG_NAME } from "@/lib/site";

/**
 * アイキャッチ画像が未設定の記事のOGP画像を生成する。
 *
 * 画像が無いと og:image が付かず、SNSに貼られたときタイトルだけの
 * 素っ気ない見た目になる。クリック率に直結するので、最低限の体裁は作る。
 *
 * coverImage が設定されている記事では generateMetadata 側がその画像を使うため、
 * ここで作ったものは使われない。未設定の記事の保険。
 */
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = BLOG_NAME;

// セグメント設定はリテラルで書くこと。定数を import して代入するとビルドが落ちる
export const revalidate = 3600;

/** カテゴリごとに色を変える。CoverPlaceholder と考え方を揃えている */
const GRADIENTS: string[] = [
  "linear-gradient(135deg, #e0f2fe 0%, #cffafe 50%, #bae6fd 100%)",
  "linear-gradient(135deg, #fef3c7 0%, #ffedd5 50%, #fde68a 100%)",
  "linear-gradient(135deg, #d1fae5 0%, #ccfbf1 50%, #a7f3d0 100%)",
  "linear-gradient(135deg, #ede9fe 0%, #f3e8ff 50%, #ddd6fe 100%)",
  "linear-gradient(135deg, #ffe4e6 0%, #fce7f3 50%, #fecdd3 100%)",
];

const GRADIENT_BY_SLUG: Record<string, number> = {
  "destination-guide": 0,
  preparation: 1,
  "model-course": 2,
};

function gradientFor(slug: string): string {
  const fixed = GRADIENT_BY_SLUG[slug];
  if (fixed !== undefined) return GRADIENTS[fixed];

  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) % GRADIENTS.length;
  }
  return GRADIENTS[hash];
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  const title = post?.title ?? BLOG_NAME;
  const categoryName = post?.category.name ?? "";
  const gradient = gradientFor(post?.category.slug ?? "");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: gradient,
          padding: "72px 80px",
        }}
      >
        {categoryName ? (
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: "rgba(255,255,255,0.75)",
              color: "#065f46",
              fontSize: 28,
              fontWeight: 700,
              padding: "10px 28px",
              borderRadius: 999,
            }}
          >
            {categoryName}
          </div>
        ) : (
          <div style={{ display: "flex" }} />
        )}

        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 56 : 68,
            fontWeight: 700,
            color: "#111827",
            lineHeight: 1.3,
            // 長いタイトルで画像からはみ出すのを防ぐ
            maxHeight: 300,
            overflow: "hidden",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 30,
            fontWeight: 600,
            color: "#047857",
          }}
        >
          {BLOG_NAME}
        </div>
      </div>
    ),
    size
  );
}
