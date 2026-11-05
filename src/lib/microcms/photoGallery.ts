/**
 * 本文中の写真を、縦に長くなりすぎない形に組み直す。
 *
 * - 写真が2枚以上つづいたら、横にスワイプして見るギャラリーにまとめる
 *   （.photo-gallery）。何枚入れても縦の長さは写真1枚ぶんで済む
 * - 1枚だけの写真は .article-photo にする。縦長の写真が画面を埋めないよう、
 *   高さに上限をつけて表示する
 *
 * 見た目は globals.css の .photo-gallery / .article-photo にある。
 *
 * microCMS のリッチエディタは、画像を1枚ずつ <figure> に入れて返す。
 *   <figure><img src="..." alt="" width="1200" height="800"><figcaption>説明</figcaption></figure>
 * 画像にリンクを付けると <img> が <a> に包まれる。
 * 古い形式や CSV に直接書いた場合の <p><img ...></p> も同じように扱う。
 * 1つの段落に画像だけを並べた <p><img><img></p> は、1枚ずつの写真とみなす。
 *
 * 写真の下には小さくタイトルを出す。figcaption があればそれを、
 * なければ画像の代替テキスト（alt。microCMS の画像設定で入れられる）を使う。
 *
 * 「つづいている」とみなすのは、写真のあいだに空白か空の段落
 * （リッチエディタで Enter を押しただけの行）しかないとき。
 * 文章を1行でも挟めば、そこでギャラリーは区切られる。
 *
 * HTML は正規表現で扱っている。前提は toc.ts と同じ（入稿者が運営のみ）。
 */
import { optimizedImageUrl } from "./format";

// 空白とみなす文字。リッチエディタへの貼り付けで &nbsp; やゼロ幅スペースが混ざることがある
const SPACE = String.raw`(?:\s|&nbsp;| |​|﻿)*`;

const IMG = String.raw`<img\s[^>]*>`;
const LINKED_IMG = String.raw`(?:<a\s[^>]*>${SPACE})?${IMG}(?:${SPACE}</a>)?`;

// 写真1枚ぶんのブロック。<figure> 形式と、写真だけが入った <p> 形式
const FIGURE_BLOCK = String.raw`<figure(?:\s[^>]*)?>${SPACE}${LINKED_IMG}${SPACE}(?:<figcaption(?:\s[^>]*)?>[\s\S]*?</figcaption>${SPACE})?</figure>`;
const PARAGRAPH_BLOCK = String.raw`<p(?:\s[^>]*)?>${SPACE}(?:${LINKED_IMG}${SPACE}(?:<br\s*/?>${SPACE})*)+</p>`;
const PHOTO_BLOCK = `(?:${FIGURE_BLOCK}|${PARAGRAPH_BLOCK})`;

// 写真のあいだに挟まっていてもよいもの: 空白と、空の段落（<p></p>、<p><br></p>、<p>&nbsp;</p>）
const GAP = String.raw`(?:\s|<p(?:\s[^>]*)?>${SPACE}(?:<br\s*/?>${SPACE})*</p>)*`;

/** 写真ブロックが1つ以上つづく範囲 */
const PHOTO_RUN = new RegExp(`${PHOTO_BLOCK}(?:${GAP}${PHOTO_BLOCK})*`, "gi");
const PHOTO_BLOCK_GLOBAL = new RegExp(PHOTO_BLOCK, "gi");

const LINKED_IMG_GLOBAL = new RegExp(LINKED_IMG, "gi");
const IMG_PATTERN = new RegExp(IMG, "i");
const LINK_OPEN_PATTERN = /<a\s[^>]*>/i;
const ALT_PATTERN = /\salt\s*=\s*"([^"]*)"/i;
const CAPTION_PATTERN = /<figcaption(?:\s[^>]*)?>([\s\S]*?)<\/figcaption>/i;

/** ギャラリーで読み込む画像の幅。スマホの高解像度画面で表示幅の約2倍 */
const GALLERY_IMAGE_WIDTH = 1200;
/** 1枚だけの写真で読み込む画像の幅。本文の最大幅（約720px）の2倍 */
const SINGLE_IMAGE_WIDTH = 1600;

type Photo = {
  img: string;
  linkOpen: string | null;
  caption: string | null;
};

/** 写真1枚ぶん（リンクで包まれていてもよい）の HTML から、画像とリンクとタイトルを取り出す */
function parseImage(html: string, figcaption: string | null): Photo | null {
  const img = html.match(IMG_PATTERN)?.[0];
  if (!img) return null;
  // alt は属性値なのでエスケープ済み。そのまま figcaption の中身に使える
  const alt = img.match(ALT_PATTERN)?.[1]?.trim() || null;
  return { img, linkOpen: html.match(LINK_OPEN_PATTERN)?.[0] ?? null, caption: figcaption || alt };
}

/** 写真ブロック1つから写真を取り出す。<p> に画像が並んでいれば複数になる */
function parsePhotos(block: string): Photo[] {
  if (/^<figure/i.test(block)) {
    const figcaption = block.match(CAPTION_PATTERN)?.[1]?.trim() || null;
    const photo = parseImage(block, figcaption);
    return photo ? [photo] : [];
  }
  return (block.match(LINKED_IMG_GLOBAL) ?? [])
    .map((html) => parseImage(html, null))
    .filter((photo): photo is Photo => photo !== null);
}

/** img タグの属性を整える。microCMS の画像なら WebP に変換した軽いものを読む */
function prepareImg(img: string, width: number, lazy: boolean): string {
  let output = img.replace(/\ssrc\s*=\s*"([^"]*)"/i, (whole, src: string) =>
    // すでにクエリが付いている画像は、入稿者が意図して指定したものとして触らない
    src.includes("?") ? whole : ` src="${optimizedImageUrl(src, width)}"`
  );
  if (lazy && !/\sloading\s*=/i.test(output)) {
    output = output.replace(/^<img/i, `<img loading="lazy" decoding="async"`);
  }
  return output;
}

function renderFigure(photo: Photo, className: string, width: number, lazy: boolean): string {
  const img = prepareImg(photo.img, width, lazy);
  const media = photo.linkOpen ? `${photo.linkOpen}${img}</a>` : img;
  const caption = photo.caption ? `<figcaption>${photo.caption}</figcaption>` : "";
  return `<figure class="${className}">${media}${caption}</figure>`;
}

function renderGallery(photos: Photo[]): string {
  const items = photos
    // 1枚目は最初から見えるので遅延読み込みにしない
    .map((photo, index) => renderFigure(photo, "photo-gallery__item", GALLERY_IMAGE_WIDTH, index > 0))
    .join("");
  return (
    `<div class="photo-gallery" data-count="${photos.length}">` +
    `<div class="photo-gallery__track" role="group" aria-label="写真${photos.length}枚" tabindex="0">${items}</div>` +
    `<p class="photo-gallery__hint" aria-hidden="true">横にスワイプして見られます（全${photos.length}枚）</p>` +
    `</div>`
  );
}

export function renderPhotoGalleries(html: string): string {
  return html.replace(PHOTO_RUN, (run) => {
    const photos = (run.match(PHOTO_BLOCK_GLOBAL) ?? []).flatMap(parsePhotos);

    if (photos.length === 0) return run;
    if (photos.length === 1) {
      return renderFigure(photos[0], "article-photo", SINGLE_IMAGE_WIDTH, true);
    }
    return renderGallery(photos);
  });
}
