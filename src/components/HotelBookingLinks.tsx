"use client";

import { ExternalLink } from "lucide-react";
import {
  buildHotelSearchLinks,
  type AffiliatePlacement,
  type HotelSearchQuery,
} from "@/lib/affiliate";
import { trackEvent } from "@/lib/analytics";

interface HotelBookingLinksProps {
  query: HotelSearchQuery;
  placement: AffiliatePlacement;
  className?: string;
  /** ボタンの上に出す見出し */
  title?: string;
  /** 見出しの下に出す補足 */
  description?: string;
}

/**
 * 宿の空室・料金を予約サイトで見るボタン群。
 *
 * アフィリエイトリンクなので、ステマ規制（景品表示法の告示）に沿って「PR」と明示し、
 * rel="sponsored" を付ける。提携先が1つも設定されていなければ何も描画しない。
 */
export default function HotelBookingLinks({
  query,
  placement,
  className = "",
  title,
  description,
}: HotelBookingLinksProps) {
  const links = buildHotelSearchLinks(query, placement);
  if (links.length === 0) return null;

  return (
    <div className={className}>
      {title && <p className="text-sm font-bold text-stone-700">{title}</p>}
      {description && <p className="mt-0.5 text-xs text-stone-500">{description}</p>}
      <div className={`flex flex-wrap gap-2 ${title || description ? "mt-2.5" : ""}`}>
        {links.map((link) => (
          <a
            key={link.provider}
            href={link.url}
            target="_blank"
            rel="sponsored noopener noreferrer"
            onClick={(e) => {
              // カードの onClick（詳細シートを開く等）に伝わらないようにする
              e.stopPropagation();
              trackEvent("affiliate_click", {
                provider: link.provider,
                placement,
                trip_type: query.tripType,
              });
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-white px-3.5 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50 transition-colors"
          >
            {link.label}で見る
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        ))}
      </div>
      <p className="mt-1.5 text-[11px] text-stone-400">
        <span className="mr-1 rounded border border-stone-300 px-1 font-semibold text-stone-500">PR</span>
        外部の予約サイトに移動します。予約が成立すると旅のしおりに紹介料が支払われることがあります。
      </p>
    </div>
  );
}
