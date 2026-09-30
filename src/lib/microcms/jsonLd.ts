/**
 * 構造化データ（JSON-LD）の生成。
 *
 * 一覧ページには Blog + ItemList を出し、ItemList に全記事の絶対URLを列挙している。
 * 検索エンジン・AI検索側が記事単体を直接たどれるようにするため。
 */
import { absoluteUrl, BLOG_DESCRIPTION, BLOG_NAME, LOGO_URL, SITE_NAME, SITE_URL } from "@/lib/site";
import type { BlogPost } from "./types";

const publisher = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: LOGO_URL,
  },
};

export function articleJsonLd(post: BlogPost) {
  const url = absoluteUrl(`/blog/${post.slug}`);
  const image = post.ogImage?.url ?? post.coverImage?.url;

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    ...(image ? { image: [image] } : {}),
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: "ja",
    articleSection: post.category.name,
    ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
    author: publisher,
    publisher,
  };
}

type Crumb = { name: string; path: string };

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function blogJsonLd(posts: BlogPost[], path = "/blog") {
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": absoluteUrl(path),
    name: BLOG_NAME,
    description: BLOG_DESCRIPTION,
    url: absoluteUrl(path),
    inLanguage: "ja",
    publisher,
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: absoluteUrl(`/blog/${post.slug}`),
      datePublished: post.publishedAt,
      dateModified: post.updatedAt,
    })),
  };
}

export function itemListJsonLd(posts: BlogPost[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: posts.map((post, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/blog/${post.slug}`),
      name: post.title,
    })),
  };
}

/** `<script type="application/ld+json">` に流し込むための文字列化 */
export function jsonLdScript(data: unknown): string {
  // `</script>` でスクリプトタグが閉じられるのを防ぐ
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
