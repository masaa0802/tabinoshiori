import Image from "next/image";
import type { Spot } from "@/lib/microcms/types";
import { googleMapsUrl, optimizedImageUrl } from "@/lib/microcms/format";

/**
 * 記事内で紹介するスポットのカード。
 *
 * 未実装: 仕様書7-1・7-2 の「ワンタップでしおりに追加」ボタンと旅程選択モーダル。
 * 型・スキーマ・表示までは用意してあるが、追加操作は作っていない。
 */
type SpotCardProps = {
  spot: Spot;
};

const SpotCard: React.FC<SpotCardProps> = ({ spot }) => {
  const mapQuery = googleMapsUrl(spot.name, {
    placeId: spot.placeId,
    address: spot.address,
  });

  return (
    <div className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {spot.photo && (
        <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:h-24 sm:w-24">
          <Image
            src={optimizedImageUrl(spot.photo.url, 200)}
            alt=""
            fill
            sizes="96px"
            className="object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-bold text-gray-900">{spot.name}</h4>
          {spot.activityType && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
              {spot.activityType}
            </span>
          )}
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
          {spot.description}
        </p>

        {spot.address && (
          <p className="mt-2 text-xs text-gray-400">{spot.address}</p>
        )}

        <a
          href={mapQuery}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z"
            />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          地図で見る
        </a>
      </div>
    </div>
  );
};

export default SpotCard;
