import type { MapLayers } from "@/lib/areas/worldMap";

type MapCanvasProps = {
  layers: MapLayers;
  /** ページ内で一意な ID。マスクとフィルタの参照に使う */
  id: string;
  /** ぼかしの強さ。スマホは画面が小さいので弱めにする */
  blur?: number;
  className?: string;
  /** "slice" は箱いっぱいに広げてはみ出しを切る（PCの背景）。"meet" は全体を収める（スマホ） */
  fit?: "slice" | "meet";
  /** 地図の上に重ねる札やピン（SVG 要素） */
  children?: React.ReactNode;
};

/**
 * 背景地図。くっきりの層とぼかした層を重ね、楕円のマスクで切り替える。
 * 札やピンは children で地図と同じ座標系に重ねる（画面幅が変わってもずれない）。
 */
const MapCanvas: React.FC<MapCanvasProps> = ({
  layers,
  id,
  blur = 3.5,
  className,
  fit = "slice",
  children,
}) => {
  const { width, height, spotlight } = layers;
  const { cx, cy, rx, ry } = spotlight;

  const layer = (land: string, highlight: string) => (
    <>
      <rect width={width} height={height} className="area-map-sea" />
      <path d={layers.graticule} className="area-map-graticule" />
      <path d={land} className="area-map-land" />
      <path d={highlight} className="area-map-highlight" />
    </>
  );

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={`xMidYMid ${fit}`}
      className={className}
      role="img"
      aria-label="地図"
    >
      <defs>
        <filter id={`${id}-blur`} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation={blur} />
        </filter>
        <radialGradient
          id={`${id}-spot`}
          gradientUnits="userSpaceOnUse"
          cx={0}
          cy={0}
          r={1}
          gradientTransform={`translate(${cx} ${cy}) scale(${rx} ${ry})`}
          fx={0}
          fy={0}
        >
          <stop offset="0.7" stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width={width} height={height} fill={`url(#${id}-spot)`} />
        </mask>
      </defs>

      <g filter={`url(#${id}-blur)`}>
        {layer(layers.blurLand, layers.blurHighlight)}
        <rect width={width} height={height} className="area-map-veil" />
      </g>
      <g mask={`url(#${id}-mask)`}>{layer(layers.sharpLand, layers.sharpHighlight)}</g>

      {children}
    </svg>
  );
};

export default MapCanvas;
