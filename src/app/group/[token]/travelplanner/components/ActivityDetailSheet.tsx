"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { getActivityTypeImage } from "@/lib/activityTypeImage";

interface Activity {
  id: number;
  itinerary_id: number;
  name: string;
  location: string;
  notes?: string;
  type: string;
  date: string;
  time: string;
  photo_url?: string;
  lat?: number;
  lng?: number;
  place_id?: string;
}

interface ActivityDetailSheetProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

const TYPE_CONFIG: Record<string, { label: string }> = {
  transport:   { label: "交通" },
  sightseeing: { label: "観光スポット" },
  restaurant:  { label: "飲食店" },
  hotel:       { label: "ホテル" },
  activity:    { label: "アクティビティ" },
  area:        { label: "エリア" },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
}

function formatTime(timeStr: string) {
  return timeStr?.substring(0, 5) ?? "";
}

const ActivityDetailSheet: React.FC<ActivityDetailSheetProps> = ({
  activity,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [visible, setVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activity?.id]);

  if (!isOpen && !visible) return null;

  const config = TYPE_CONFIG[activity?.type ?? ""] ?? TYPE_CONFIG.area;

  const googleMapsUrl = activity?.lat && activity?.lng
    ? `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}${activity.place_id ? `&query_place_id=${activity.place_id}` : ""}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity?.location ?? "")}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center">
      {/* バックドロップ */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* シート / モーダル */}
      <div
        className={`
          relative w-full bg-white flex flex-col
          rounded-t-2xl md:rounded-2xl
          max-h-[90vh] md:max-h-[80vh] md:max-w-lg md:w-full md:mx-4
          transition-transform duration-300 ease-out
          ${visible ? "translate-y-0 md:scale-100 md:opacity-100" : "translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"}
        `}
      >
        {/* ドラッグハンドル（モバイルのみ） */}
        <div className="md:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* ヘッダーイラスト（種別ごとに固定。写真は使わない） */}
        <div className="relative flex-shrink-0 h-44 md:h-52 overflow-hidden md:rounded-t-2xl">
          <Image
            src={getActivityTypeImage(activity?.type, { motion: true })}
            alt=""
            fill
            unoptimized
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />

          {/* 閉じるボタン */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* タイプバッジ + 時間 + 名前 */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                {config.label}
              </span>
              <span className="text-white/80 text-sm font-medium">
                {activity?.time ? formatTime(activity.time) : ""}
                {activity?.date ? `　${formatDate(activity.date)}` : ""}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight drop-shadow">
              {activity?.name}
            </h2>
          </div>
        </div>

        {/* スクロール可能なコンテンツ */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* 場所 */}
            {activity?.location && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="flex-1 text-sm text-gray-700 leading-relaxed pt-1">{activity.location}</p>
              </div>
            )}

            {/* メモ */}
            {activity?.notes && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">メモ</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{activity.notes}</p>
              </div>
            )}

            {/* アクションボタン */}
            <div className="border-t border-gray-100 pt-4 pb-2 space-y-2">
              {/* Google マップで開く */}
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Google マップで開く
              </a>

              <div className="flex gap-2">
                <button
                  onClick={() => activity && onEdit(activity)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  編集
                </button>
                <button
                  onClick={() => activity && onDelete(activity)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-red-100 hover:bg-red-50 text-red-500 rounded-xl font-medium text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  削除
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailSheet;
