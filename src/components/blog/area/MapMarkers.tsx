import Link from "next/link";
import type { Point, Rect } from "@/lib/areas/worldMap";

/**
 * 地図に重ねる札とピン。すべて SVG の中に描くので、地図と一緒に拡大縮小してずれない。
 */

export type StickerSize = "pc" | "sp";

const STICKER = {
  pc: { font: 19, height: 46, padX: 14, gap: 10, badgeFont: 12 },
  sp: { font: 16, height: 42, padX: 11, gap: 7, badgeFont: 11 },
} as const;

/** 日本語の見出し文字はほぼ全角幅として幅を見積もる */
function textWidth(text: string, font: number): number {
  let width = 0;
  for (const char of text) {
    width += /[\x20-\x7e]/.test(char) ? font * 0.6 : font;
  }
  return width;
}

function badgeWidth(label: string, font: number): number {
  return textWidth(label, font) + 14;
}

export function stickerWidth(name: string, count: number, size: StickerSize): number {
  const s = STICKER[size];
  return s.padX * 2 + textWidth(name, s.font) + s.gap + badgeWidth(`${count}記事`, s.badgeFont);
}

export type PlacedSticker = {
  key: string;
  name: string;
  count: number;
  href: string;
  anchor: Point;
  /** 札の左上 */
  x: number;
  y: number;
  width: number;
  /** 引き出し線の折れ点。省略時はまっすぐつなぐ */
  elbow?: Point;
};

type StickerInput = { key: string; name: string; count: number; href: string; anchor: Point };

function overlaps(a: PlacedSticker, b: PlacedSticker, height: number, gap: number): boolean {
  return (
    a.x < b.x + b.width + gap &&
    b.x < a.x + a.width + gap &&
    a.y < b.y + height + gap &&
    b.y < a.y + height + gap
  );
}

/**
 * 国がまばらなとき: 札を国のすぐそばに置く。
 * くっきり見える範囲の中心から外へ押し出す向きに置き、重なったら上下にずらす。
 */
export function placeNearby(
  items: StickerInput[],
  focus: Rect,
  bounds: Rect,
  size: StickerSize
): PlacedSticker[] {
  const { height } = STICKER[size];
  const distance = size === "pc" ? 88 : 62;
  const cx = (focus[0] + focus[2]) / 2;
  const cy = (focus[1] + focus[3]) / 2;

  const placed = items.map((item) => {
    const width = stickerWidth(item.name, item.count, size);
    let dx = item.anchor[0] - cx;
    let dy = item.anchor[1] - cy;
    const length = Math.hypot(dx, dy);
    if (length < 1) {
      dx = 0;
      dy = -1;
    } else {
      dx /= length;
      dy /= length;
    }
    const centerX = item.anchor[0] + dx * distance;
    const centerY = item.anchor[1] + dy * distance * 0.8;
    return { ...item, width, x: centerX - width / 2, y: centerY - height / 2 };
  });

  const clamp = (sticker: PlacedSticker) => {
    sticker.x = Math.min(Math.max(sticker.x, bounds[0]), bounds[2] - sticker.width);
    sticker.y = Math.min(Math.max(sticker.y, bounds[1]), bounds[3] - height);
  };

  placed.forEach(clamp);
  for (let round = 0; round < 24; round++) {
    let moved = false;
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        if (!overlaps(a, b, height, 8)) continue;
        const push = (height + 8 - Math.abs(a.y - b.y)) / 2 + 1;
        if (a.y <= b.y) {
          a.y -= push;
          b.y += push;
        } else {
          a.y += push;
          b.y -= push;
        }
        clamp(a);
        clamp(b);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return placed;
}

/**
 * 国が混み合うとき（PC）: 札を右側に1列で並べ、折れ線で国とつなぐ。
 * 並びは国の上下の位置順にして、線ができるだけ交差しないようにする。
 */
export function placeInColumn(
  items: StickerInput[],
  columnX: number,
  top: number,
  bottom: number,
  size: StickerSize
): PlacedSticker[] {
  const { height } = STICKER[size];
  const sorted = [...items].sort((a, b) => a.anchor[1] - b.anchor[1]);
  const step = sorted.length > 1 ? (bottom - top - height) / (sorted.length - 1) : 0;
  return sorted.map((item, index) => {
    const y = sorted.length > 1 ? top + step * index : (top + bottom - height) / 2;
    return {
      ...item,
      width: stickerWidth(item.name, item.count, size),
      x: columnX,
      y,
      elbow: [columnX - 26, y + height / 2],
    };
  });
}

export const MapStickers: React.FC<{ stickers: PlacedSticker[]; size: StickerSize }> = ({
  stickers,
  size,
}) => {
  const s = STICKER[size];
  return (
    <g>
      {stickers.map((sticker) => {
        const midY = sticker.y + s.height / 2;
        const endX =
          sticker.anchor[0] < sticker.x
            ? sticker.x
            : sticker.anchor[0] > sticker.x + sticker.width
              ? sticker.x + sticker.width
              : sticker.x + sticker.width / 2;
        const endY =
          endX === sticker.x + sticker.width / 2
            ? sticker.anchor[1] < sticker.y
              ? sticker.y
              : sticker.y + s.height
            : midY;
        const points = sticker.elbow
          ? `${sticker.anchor[0]},${sticker.anchor[1]} ${sticker.elbow[0]},${sticker.elbow[1]} ${sticker.x},${midY}`
          : `${sticker.anchor[0]},${sticker.anchor[1]} ${endX},${endY}`;
        const badge = `${sticker.count}記事`;
        const bw = badgeWidth(badge, s.badgeFont);
        const nameX = sticker.x + s.padX;
        const badgeX = sticker.x + sticker.width - s.padX - bw;
        return (
          <g key={sticker.key}>
            <polyline points={points} className="area-map-leader" />
            <circle cx={sticker.anchor[0]} cy={sticker.anchor[1]} r={size === "pc" ? 4.5 : 4} className="area-map-dot" />
            <Link href={sticker.href} className="area-map-sticker" aria-label={`${sticker.name}の記事（${badge}）`}>
              <rect
                x={sticker.x}
                y={sticker.y + 3}
                width={sticker.width}
                height={s.height}
                rx={6}
                className="area-map-sticker-shadow"
              />
              <rect
                x={sticker.x}
                y={sticker.y}
                width={sticker.width}
                height={s.height}
                rx={6}
                className="area-map-sticker-body"
              />
              <text
                x={nameX}
                y={midY}
                dominantBaseline="central"
                className="area-map-sticker-name"
                style={{ fontSize: s.font }}
              >
                {sticker.name}
              </text>
              <rect
                x={badgeX}
                y={midY - 9.5}
                width={bw}
                height={19}
                rx={9.5}
                className="area-map-sticker-badge"
              />
              <text
                x={badgeX + bw / 2}
                y={midY}
                dominantBaseline="central"
                textAnchor="middle"
                className="area-map-sticker-count"
                style={{ fontSize: s.badgeFont }}
              >
                {badge}
              </text>
            </Link>
          </g>
        );
      })}
    </g>
  );
};

export type MapPin = {
  key: string;
  label?: string;
  number?: number;
  point: Point;
  href?: string;
  current?: boolean;
  /** 記事がまだない地域。薄く出す */
  muted?: boolean;
};

/** 番号つきのピン。スマホで国が混み合うときと、国・地域ページの地域に使う */
export const MapPins: React.FC<{ pins: MapPin[]; size: StickerSize; showLabels?: boolean }> = ({
  pins,
  size,
  showLabels = true,
}) => {
  const r = size === "pc" ? 13 : 12;
  // ラベルは右・左・上・下の順に試し、先に置いたラベルやピンと重ならない向きに出す
  type Box = [number, number, number, number];
  const hit = (a: Box, b: Box) => a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
  const labelFont = 15;
  const taken: Box[] = pins.map((pin) => [pin.point[0] - r, pin.point[1] - r, pin.point[0] + r, pin.point[1] + r]);
  const sides = new Map<string, "right" | "left" | "above" | "below">();
  for (const pin of pins) {
    if (!showLabels || !pin.label) continue;
    const [x, y] = pin.point;
    const w = pin.label.length * labelFont + 4;
    const h = labelFont + 4;
    const options: ["right" | "left" | "above" | "below", Box][] = [
      ["right", [x + r + 4, y - h / 2, x + r + 4 + w, y + h / 2]],
      ["left", [x - r - 4 - w, y - h / 2, x - r - 4, y + h / 2]],
      ["above", [x - w / 2, y - r - 4 - h, x + w / 2, y - r - 4]],
      ["below", [x - w / 2, y + r + 4, x + w / 2, y + r + 4 + h]],
    ];
    const own: Box = [x - r, y - r, x + r, y + r];
    const free = options.find(([, box]) => !taken.some((other) => other !== own && hit(box, other) && !(other[0] === own[0] && other[1] === own[1])));
    const [side, box] = free ?? options[0];
    sides.set(pin.key, side);
    taken.push(box);
  }

  return (
    <g>
      {pins.map((pin) => {
        const [x, y] = pin.point;
        const side = sides.get(pin.key) ?? "right";
        const labelProps =
          side === "right"
            ? { x: x + r + 6, y, textAnchor: "start" as const }
            : side === "left"
              ? { x: x - r - 6, y, textAnchor: "end" as const }
              : side === "above"
                ? { x, y: y - r - 13, textAnchor: "middle" as const }
                : { x, y: y + r + 13, textAnchor: "middle" as const };
        const body = (
          <g
            className={`area-map-pin${pin.current ? " is-current" : ""}${pin.muted ? " is-muted" : ""}`}
          >
            {/* 指で押しやすいように、見た目より広い透明の当たり判定を置く */}
            <circle cx={x} cy={y} r={22} className="area-map-pin-hit" />
            <circle cx={x} cy={y} r={pin.current ? r + 2 : r} className="area-map-pin-circle" />
            {pin.number !== undefined && (
              <text x={x} y={y} dominantBaseline="central" textAnchor="middle" className="area-map-pin-number">
                {pin.number}
              </text>
            )}
            {showLabels && pin.label && (
              <text {...labelProps} dominantBaseline="central" className="area-map-pin-label">
                {pin.label}
              </text>
            )}
          </g>
        );
        return pin.href && !pin.current ? (
          <Link key={pin.key} href={pin.href} aria-label={pin.label}>
            {body}
          </Link>
        ) : (
          <g key={pin.key}>{body}</g>
        );
      })}
    </g>
  );
};
