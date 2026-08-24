"use client";

import { useState, useEffect, useRef } from "react";
import ActivityImage from "@/components/ActivityImage";

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

const TYPE_CONFIG: Record<string, { label: string; headerBg: string }> = {
  transport:   { label: "交通",         headerBg: "bg-blue-500" },
  sightseeing: { label: "観光スポット",   headerBg: "bg-green-500" },
  restaurant:  { label: "飲食店",        headerBg: "bg-orange-500" },
  hotel:       { label: "ホテル",        headerBg: "bg-purple-500" },
  activity:    { label: "アクティビティ", headerBg: "bg-red-500" },
  area:        { label: "エリア",        headerBg: "bg-gray-500" },
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
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [visible, setVisible] = useState(false);
  const [displayActivity, setDisplayActivity] = useState<Activity | null>(activity);
  const scrollRef = useRef<HTMLDivElement>(null);

  // activity が渡っている間だけ表示用データを更新し、閉じる際は
  // アニメーションが終わるまで直前の内容を保持する
  useEffect(() => {
    if (activity) setDisplayActivity(activity);
  }, [activity]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [activity?.id]);

  if (!shouldRender) return null;

  const activityData = displayActivity;
  const config = TYPE_CONFIG[activityData?.type ?? ""] ?? TYPE_CONFIG.area;

  const googleMapsUrl = activityData?.lat && activityData?.lng
    ? `https://www.google.com/maps/search/?api=1&query=${activityData.lat},${activityData.lng}${activityData.place_id ? `&query_place_id=${activityData.place_id}` : ""}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activityData?.location ?? "")}`;

  return (
    <div className="fixed inset-0 z-50 flex md:items-center md:justify-center">
      {/* バックドロップ（デスクトップのみ表示） */}
      <div
        className={`hidden md:block absolute inset-0 bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={onClose}
      />

      {/* 詳細画面 / モーダル */}
      <div
        className={`
          relative w-full bg-white flex flex-col
          h-full md:h-auto
          md:rounded-2xl
          md:max-h-[80vh] md:max-w-lg md:w-full md:mx-4
          transition-transform duration-300 ease-out
          ${visible ? "translate-y-0 md:scale-100 md:opacity-100" : "translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"}
        `}
      >
        {/* ヘッダー写真 or カラーヘッダー */}
        <div className="relative flex-shrink-0 h-44 md:h-52 overflow-hidden md:rounded-t-2xl">
          {activityData?.photo_url ? (
            <>
              <ActivityImage
                src={activityData.photo_url}
                alt={activityData.name ?? ""}
                placeId={activityData.place_id}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            </>
          ) : (
            <div className={`absolute inset-0 ${config.headerBg} flex items-center justify-center`}>
              <svg className="w-20 h-20 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          )}

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
                {activityData?.time ? formatTime(activityData.time) : ""}
                {activityData?.date ? `　${formatDate(activityData.date)}` : ""}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white leading-tight drop-shadow">
              {activityData?.name}
            </h2>
          </div>
        </div>

        {/* スクロール可能なコンテンツ */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-4">

            {/* 場所 */}
            {activityData?.location && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="flex-1 text-sm text-gray-700 leading-relaxed pt-1">{activityData.location}</p>
              </div>
            )}

            {/* メモ */}
            {activityData?.notes && (
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">メモ</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{activityData.notes}</p>
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
                  onClick={() => activityData && onEdit(activityData)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  編集
                </button>
                <button
                  onClick={() => activityData && onDelete(activityData)}
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
