/**
 * 背景地図の座標系。
 *
 * PC は幅 1920 の SVG を画面幅に合わせて左右を切り落として使う（preserveAspectRatio slice）。
 * 本文の幅（max-w-5xl = 1024px）は中央の [CONTENT_LEFT, CONTENT_RIGHT] に当たるので、
 * 札やピンは必ずこの範囲に収める。画面幅 1024px 以上（lg）でだけ使う。
 *
 * スマホは幅 390 の SVG を幅いっぱいに縮小・拡大して使う（meet）。
 */
export const WIDE_WIDTH = 1920;
export const CONTENT_LEFT = (WIDE_WIDTH - 1024) / 2;
export const CONTENT_RIGHT = CONTENT_LEFT + 1024;
/** 左に重ねる見出しの幅（余白込み）。地図の見せ場はこの右から */
export const INTRO_RIGHT = CONTENT_LEFT + 430;

export const NARROW_WIDTH = 390;
