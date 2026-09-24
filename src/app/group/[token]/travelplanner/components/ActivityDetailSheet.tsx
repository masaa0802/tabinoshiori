"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";
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

interface PlaceDetails {
  formatted_address?: string;
  formatted_phone_number?: string;
  opening_hours?: google.maps.places.PlaceOpeningHours;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  url?: string;
  price_level?: number;
  reviews?: google.maps.places.PlaceReview[];
}

interface ActivityDetailSheetProps {
  activity: Activity | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  transport:   { label: "交通",           color: "#3B82F6" },
  sightseeing: { label: "観光スポット",   color: "#10B981" },
  restaurant:  { label: "飲食店",         color: "#F59E0B" },
  hotel:       { label: "ホテル",         color: "#8B5CF6" },
  activity:    { label: "アクティビティ", color: "#EF4444" },
  area:        { label: "エリア",         color: "#6B7280" },
};

/**
 * 開いた直後のバックドロップのクリックは無視する。
 * スマホではカードのタップで開いた後に遅れて届く click が、
 * 開いたばかりのバックドロップに当たってすぐ閉じてしまうため。
 */
const BACKDROP_GUARD_MS = 400;

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric", weekday: "short" });
}

function formatTime(timeStr: string) {
  return timeStr?.substring(0, 5) ?? "";
}

function Stars({ rating, className }: { rating: number; className: string }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`${className} ${star <= Math.round(rating) ? "text-yellow-400" : "text-gray-200"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
        {icon}
      </div>
      <div className="flex-1 min-w-0 text-sm text-gray-700 leading-relaxed pt-1.5">{children}</div>
    </div>
  );
}

const ActivityDetailSheet: React.FC<ActivityDetailSheetProps> = ({
  activity,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [visible, setVisible] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [hoursExpanded, setHoursExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const { isLoaded } = useGoogleMaps();

  useEffect(() => {
    if (!isOpen) {
      setVisible(false);
      return;
    }
    openedAtRef.current = Date.now();
    // 閉じた後に遅れて visible が true に戻らないよう、必ず取り消す
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [isOpen]);

  // Esc で閉じる + 背面のスクロールを止める
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    setHoursExpanded(false);
  }, [activity?.id]);

  useEffect(() => {
    if (isLoaded && window.google?.maps?.places && !placesService.current) {
      placesService.current = new window.google.maps.places.PlacesService(document.createElement("div"));
    }
  }, [isLoaded]);

  // Google の場所情報（評価・営業時間・電話など）を取得
  useEffect(() => {
    setPlaceDetails(null);
    if (!isOpen || !activity?.place_id || !isLoaded || !placesService.current) {
      setPlaceLoading(false);
      return;
    }

    let cancelled = false;
    setPlaceLoading(true);
    placesService.current.getDetails(
      {
        placeId: activity.place_id,
        fields: [
          "formatted_address",
          "formatted_phone_number",
          "opening_hours",
          "utc_offset_minutes",
          "rating",
          "user_ratings_total",
          "website",
          "url",
          "price_level",
          "reviews",
        ],
        language: "ja",
      },
      (place, status) => {
        if (cancelled) return;
        setPlaceLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          setPlaceDetails({
            formatted_address: place.formatted_address,
            formatted_phone_number: place.formatted_phone_number,
            opening_hours: place.opening_hours,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            website: place.website,
            url: place.url,
            price_level: place.price_level,
            reviews: place.reviews,
          });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [isOpen, activity?.place_id, isLoaded]);

  if (!isOpen || !activity) return null;

  const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.area;

  const googleMapsUrl = placeDetails?.url
    ?? (activity.lat && activity.lng
      ? `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}${activity.place_id ? `&query_place_id=${activity.place_id}` : ""}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location || activity.name)}`);

  const address = placeDetails?.formatted_address || activity.location;

  // Google の weekday_text は月曜始まり、getDay() は日曜始まり
  const todayIndex = new Date().getDay();
  const todayWeekdayTextIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const weekdayText = placeDetails?.opening_hours?.weekday_text;
  const todayHours = weekdayText?.[todayWeekdayTextIndex];
  let isOpenNow: boolean | undefined;
  try {
    isOpenNow = placeDetails?.opening_hours?.isOpen?.();
  } catch {
    isOpenNow = undefined;
  }
  const priceLevelStr = placeDetails?.price_level ? "¥".repeat(placeDetails.price_level) : null;

  const handleBackdropClick = () => {
    if (Date.now() - openedAtRef.current < BACKDROP_GUARD_MS) return;
    onClose();
  };

  const markerIcon = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
    `<svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg"><path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${config.color}"/><circle cx="15" cy="15" r="6" fill="white"/></svg>`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center" role="dialog" aria-modal="true" aria-label={activity.name}>
      {/* バックドロップ */}
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0"}`}
        onClick={handleBackdropClick}
      />

      {/* シート（モバイルは全画面） / モーダル */}
      <div
        className={`
          relative w-full bg-white flex flex-col overflow-hidden
          h-[100dvh] md:h-auto md:max-h-[85vh] md:max-w-lg md:mx-4 md:rounded-2xl
          transition-all duration-300 ease-out
          ${visible ? "translate-y-0 md:scale-100 md:opacity-100" : "translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"}
        `}
      >
        {/* 閉じるボタン（スクロールしても常に押せる位置に固定） */}
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 w-10 h-10 bg-black/40 hover:bg-black/60 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* スクロール可能なコンテンツ */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {/* ヘッダーイラスト（種別ごとに固定。写真は使わない） */}
          <div className="relative h-56 md:h-52 overflow-hidden">
            <Image
              src={getActivityTypeImage(activity, { motion: true })}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            {/* タイプバッジ + 名前 */}
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 mb-1.5 rounded-full bg-white/20 backdrop-blur-sm text-white border border-white/30">
                {config.label}
              </span>
              <h2 className="text-xl font-bold text-white leading-tight drop-shadow break-words">
                {activity.name}
              </h2>
            </div>
          </div>

          <div className="px-4 pb-4">
            {/* 評価・価格帯・営業中 */}
            {placeDetails && (placeDetails.rating != null || priceLevelStr || isOpenNow !== undefined) && (
              <div className="flex items-center gap-3 flex-wrap pt-3">
                {placeDetails.rating != null && (
                  <div className="flex items-center gap-1">
                    <Stars rating={placeDetails.rating} className="w-4 h-4" />
                    <span className="text-sm font-medium text-gray-700">{placeDetails.rating}</span>
                    {placeDetails.user_ratings_total != null && (
                      <span className="text-xs text-gray-400">({placeDetails.user_ratings_total})</span>
                    )}
                  </div>
                )}
                {priceLevelStr && <span className="text-sm font-medium text-gray-600">{priceLevelStr}</span>}
                {isOpenNow !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isOpenNow ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isOpenNow ? "営業中" : "営業時間外"}
                  </span>
                )}
              </div>
            )}

            <div className="divide-y divide-gray-100">
              {/* 日時 */}
              {(activity.date || activity.time) && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                >
                  {activity.date && formatDate(activity.date)}
                  {activity.time && <span className="ml-2 font-medium text-gray-900">{formatTime(activity.time)}</span>}
                </InfoRow>
              )}

              {/* 場所 */}
              {address && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  }
                >
                  <p className="break-words">{address}</p>
                </InfoRow>
              )}

              {/* 営業時間 */}
              {weekdayText && weekdayText.length > 0 && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  }
                >
                  {!hoursExpanded ? (
                    <button type="button" onClick={() => setHoursExpanded(true)} className="text-left">
                      <span className="text-gray-900">{todayHours ?? "営業時間"}</span>
                      <span className="block text-xs text-blue-600 mt-0.5">すべての営業時間を表示</span>
                    </button>
                  ) : (
                    <div className="space-y-0.5">
                      {weekdayText.map((text, i) => (
                        <p key={i} className={i === todayWeekdayTextIndex ? "text-gray-900 font-medium" : "text-gray-600"}>
                          {text}
                        </p>
                      ))}
                      <button type="button" onClick={() => setHoursExpanded(false)} className="text-xs text-blue-600 mt-1">
                        閉じる
                      </button>
                    </div>
                  )}
                </InfoRow>
              )}

              {/* 電話 */}
              {placeDetails?.formatted_phone_number && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  }
                >
                  <a href={`tel:${placeDetails.formatted_phone_number}`} className="text-blue-600">
                    {placeDetails.formatted_phone_number}
                  </a>
                </InfoRow>
              )}

              {/* ウェブサイト */}
              {placeDetails?.website && (
                <InfoRow
                  icon={
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  }
                >
                  <a href={placeDetails.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
                    {placeDetails.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                  </a>
                </InfoRow>
              )}
            </div>

            {placeLoading && (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400" />
                Google の情報を取得中...
              </div>
            )}

            {/* メモ */}
            {activity.notes && (
              <div className="mt-2 bg-gray-50 rounded-xl p-3">
                <p className="text-xs font-semibold text-gray-500 mb-1">メモ</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed break-words">{activity.notes}</p>
              </div>
            )}

            {/* ミニ地図 */}
            {activity.lat && activity.lng && isLoaded && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-4 rounded-xl overflow-hidden border border-gray-200"
              >
                <div className="h-40 pointer-events-none">
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={{ lat: activity.lat, lng: activity.lng }}
                    zoom={15}
                    options={{ disableDefaultUI: true, gestureHandling: "none", clickableIcons: false }}
                  >
                    <Marker position={{ lat: activity.lat, lng: activity.lng }} icon={markerIcon} />
                  </GoogleMap>
                </div>
              </a>
            )}

            {/* レビュー */}
            {placeDetails?.reviews && placeDetails.reviews.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-gray-500 mb-2">レビュー</p>
                <div className="space-y-3">
                  {placeDetails.reviews.slice(0, 3).map((review, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-1.5">
                        {review.profile_photo_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={review.profile_photo_url} alt="" className="w-6 h-6 rounded-full" />
                        )}
                        <span className="text-sm font-medium text-gray-800 truncate">{review.author_name}</span>
                        <div className="ml-auto flex-shrink-0">
                          <Stars rating={review.rating || 0} className="w-3 h-3" />
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-4">{review.text}</p>
                      {review.relative_time_description && (
                        <p className="text-xs text-gray-400 mt-1">{review.relative_time_description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン（下部に固定） */}
        <div className="flex-shrink-0 border-t border-gray-100 bg-white px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] space-y-2">
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
              type="button"
              onClick={() => onEdit(activity)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl font-medium text-sm transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              編集
            </button>
            <button
              type="button"
              onClick={() => onDelete(activity)}
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
  );
};

export default ActivityDetailSheet;
