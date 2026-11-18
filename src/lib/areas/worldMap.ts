/**
 * 「地図から探す」の背景地図を SVG のパスとして組み立てる。
 *
 * 描画はサーバーだけで行い、ブラウザには出来上がった SVG だけを送る
 * （地図データと d3-geo をクライアントに載せないため）。
 *
 * 見せ方: 地図をページの背景いっぱいに敷き、focus で指定した範囲だけをくっきり、
 * その外側はぼかして紙の色に溶かす。ぼかした層には粗い地図（110m）、
 * くっきりの層には細かい地図（50m）を使い、どちらも画面に入る範囲だけを出力して
 * HTML の大きさを抑えている。
 */
import "server-only";
import { geoBounds, geoCentroid, geoGraticule10, geoMercator, geoPath } from "d3-geo";
import type { GeoProjection } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import countries50m from "world-atlas/countries-50m.json";
import countries110m from "world-atlas/countries-110m.json";
import type { Bounds, Country, LonLat } from "@/data/areas";

type CountryFeature = Feature<Geometry, { name: string }>;

function toFeatures(topology: unknown): CountryFeature[] {
  const topo = topology as Topology<{ countries: GeometryCollection<{ name: string }> }>;
  const collection = feature(topo, topo.objects.countries) as FeatureCollection<
    Geometry,
    { name: string }
  >;
  return collection.features;
}

let fine: CountryFeature[] | null = null;
let coarse: CountryFeature[] | null = null;

function fineFeatures(): CountryFeature[] {
  fine ??= toFeatures(countries50m);
  return fine;
}

function coarseFeatures(): CountryFeature[] {
  coarse ??= toFeatures(countries110m);
  return coarse;
}

/** 画面上の矩形 [左, 上, 右, 下] */
export type Rect = [number, number, number, number];
export type Point = [number, number];

export type MapOptions = {
  width: number;
  height: number;
  /** くっきり見せる画面上の範囲。fit の地理範囲がここに収まるように縮尺を決める */
  focus: Rect;
  /** focus に収める地理範囲。国を渡すとその国の形（または指定の範囲）に合わせる */
  fit: Bounds | Country;
  /** 朱色で塗る国（isoNumeric） */
  highlight: string[];
  /** fit の範囲がこれより狭いときは、縦横ともこの度数まで広げてから合わせる */
  minSpan?: number;
};

export type MapLayers = {
  width: number;
  height: number;
  graticule: string;
  /** ぼかす層 */
  blurLand: string;
  blurHighlight: string;
  /** くっきりの層 */
  sharpLand: string;
  sharpHighlight: string;
  /** くっきり見せる範囲（楕円）。マスクのグラデーションに使う */
  spotlight: { cx: number; cy: number; rx: number; ry: number };
};

export type WorldMap = {
  layers: MapLayers;
  project: (lonLat: LonLat) => Point;
};

function boundsToGeometry(bounds: Bounds) {
  return { type: "MultiPoint" as const, coordinates: bounds };
}

function featureOf(country: Country): CountryFeature | undefined {
  return fineFeatures().find((item) => String(item.id) === country.isoNumeric);
}

/**
 * 地理範囲を、縦横とも minSpan 度以上になるよう中心から広げる。
 * 台湾やシンガポールのような小さな国で寄りすぎると、地図の粗さが目立ち周りの様子も分からなくなるため。
 */
function expandBounds([[w, s], [e, n]]: Bounds, minSpan: number): Bounds {
  const cx = (w + e) / 2;
  const cy = (s + n) / 2;
  const halfX = Math.max(e - w, minSpan) / 2;
  const halfY = Math.max(n - s, minSpan) / 2;
  return [
    [cx - halfX, cy - halfY],
    [cx + halfX, cy + halfY],
  ];
}

function fitTarget(fit: Bounds | Country, minSpan: number) {
  const bounds = Array.isArray(fit) ? fit : boundsOf(fit);
  return boundsToGeometry(expandBounds(bounds, minSpan));
}

function pathsOf(
  features: CountryFeature[],
  projection: GeoProjection,
  highlight: Set<string>,
  digits = 1
): { land: string; highlight: string } {
  const path = geoPath(projection).digits(digits);
  let land = "";
  let marked = "";
  for (const item of features) {
    const d = path(item);
    if (!d) continue;
    if (highlight.has(String(item.id))) marked += d;
    else land += d;
  }
  return { land, highlight: marked };
}

export function buildWorldMap({
  width,
  height,
  focus,
  fit,
  highlight,
  minSpan = 0,
}: MapOptions): WorldMap {
  const [x0, y0, x1, y1] = focus;
  const base = geoMercator().fitExtent(
    [
      [x0, y0],
      [x1, y1],
    ],
    fitTarget(fit, minSpan)
  );
  const marked = new Set(highlight);

  // ぼかす層: 画面全体
  const margin = 24;
  const wide = geoMercator()
    .scale(base.scale())
    .translate(base.translate())
    .clipExtent([
      [-margin, -margin],
      [width + margin, height + margin],
    ]);
  // ぼかす層は輪郭が見えないので、座標を整数に丸めて軽くする
  const blur = pathsOf(coarseFeatures(), wide, marked, 0);

  // くっきりの層: 楕円の外接矩形だけ
  const cx = (x0 + x1) / 2;
  const cy = (y0 + y1) / 2;
  const rx = ((x1 - x0) / 2) * 1.3;
  const ry = ((y1 - y0) / 2) * 1.3;
  const narrow = geoMercator()
    .scale(base.scale())
    .translate(base.translate())
    .clipExtent([
      [Math.max(-margin, cx - rx), Math.max(-margin, cy - ry)],
      [Math.min(width + margin, cx + rx), Math.min(height + margin, cy + ry)],
    ]);
  // 引きの地図（エリア全体など）では、朱色の国だけ細かい地図にして、ほかの国は粗い地図で軽くする
  const pixelsPerDegree = (base.scale() * Math.PI) / 180;
  const sharp =
    pixelsPerDegree >= 24
      ? pathsOf(fineFeatures(), narrow, marked)
      : {
          land: pathsOf(coarseFeatures(), narrow, marked).land,
          highlight: pathsOf(
            fineFeatures().filter((item) => marked.has(String(item.id))),
            narrow,
            marked
          ).highlight,
        };

  const graticule = geoPath(wide).digits(1)(geoGraticule10()) ?? "";

  return {
    layers: {
      width,
      height,
      graticule,
      blurLand: blur.land,
      blurHighlight: blur.highlight,
      sharpLand: sharp.land,
      sharpHighlight: sharp.highlight,
      spotlight: { cx, cy, rx, ry },
    },
    project: (lonLat) => {
      const point = base(lonLat);
      return point ? [point[0], point[1]] : [-9999, -9999];
    },
  };
}

/** 札をつなぐ国の代表点 */
export function anchorOf(country: Country): LonLat {
  if (country.anchor) return country.anchor;
  const shape = featureOf(country);
  if (!shape) return [0, 0];
  const [lon, lat] = geoCentroid(shape);
  return [lon, lat];
}

/** 国の地理範囲。地域ページで周りをどこまで映すかの基準に使う */
export function boundsOf(country: Country): Bounds {
  if (country.bounds) return country.bounds;
  const shape = featureOf(country);
  if (!shape) return [[0, 0], [1, 1]];
  const [[w, s], [e, n]] = geoBounds(shape);
  return [[w, s], [e, n]];
}
