"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
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
  name?: string;
  formatted_address?: string;
  formatted_phone_number?: string;
  opening_hours?: google.maps.places.PlaceOpeningHours;
  rating?: number;
  user_ratings_total?: number;
  website?: string;
  url?: string;
  price_level?: number;
  photos?: google.maps.places.PlacePhoto[];
  reviews?: google.maps.places.PlaceReview[];
}

interface ActivityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  activity: Activity | null;
  onEdit: (activity: Activity) => void;
}

const getMarkerColor = (type: string) => {
  const colors: { [key: string]: string } = {
    transport: "#3B82F6",
    sightseeing: "#10B981",
    restaurant: "#F59E0B",
    hotel: "#8B5CF6",
    activity: "#EF4444",
    area: "#6B7280",
  };
  return colors[type] || "#6B7280";
};

const getTypeLabel = (type: string) => {
  const typeLabels: { [key: string]: string } = {
    transport: "交通",
    sightseeing: "観光スポット",
    restaurant: "飲食店",
    hotel: "ホテル",
    activity: "アクティビティ",
    area: "エリア",
  };
  return typeLabels[type] || type;
};

const formatTime = (timeString: string) => {
  if (!timeString) return "";
  return timeString.substring(0, 5);
};

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  isOpen,
  onClose,
  activity,
  onEdit,
}) => {
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [placeLoading, setPlaceLoading] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [hoursExpanded, setHoursExpanded] = useState(false);

  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const { isLoaded } = useGoogleMaps();

  // Initialize PlacesService
  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      const mapDiv = document.createElement("div");
      const map = new window.google.maps.Map(mapDiv);
      placesService.current = new window.google.maps.places.PlacesService(map);
    }
  }, [isLoaded]);

  // Fetch place details when activity changes
  useEffect(() => {
    if (!isOpen || !activity) {
      setPlaceDetails(null);
      setPhotoUrls([]);
      setPhotoIndex(0);
      setHoursExpanded(false);
      return;
    }

    if (!activity.place_id || !placesService.current) {
      setPlaceDetails(null);
      // Use activity photo_url only
      setPhotoUrls(activity.photo_url ? [activity.photo_url] : []);
      setPhotoIndex(0);
      return;
    }

    setPlaceLoading(true);
    placesService.current.getDetails(
      {
        placeId: activity.place_id,
        fields: [
          "name",
          "formatted_address",
          "formatted_phone_number",
          "opening_hours",
          "rating",
          "user_ratings_total",
          "website",
          "url",
          "price_level",
          "photos",
          "reviews",
        ],
        language: "ja",
      },
      (place, status) => {
        setPlaceLoading(false);
        if (
          status === window.google.maps.places.PlacesServiceStatus.OK &&
          place
        ) {
          setPlaceDetails({
            name: place.name,
            formatted_address: place.formatted_address,
            formatted_phone_number: place.formatted_phone_number,
            opening_hours: place.opening_hours,
            rating: place.rating,
            user_ratings_total: place.user_ratings_total,
            website: place.website,
            url: place.url,
            price_level: place.price_level,
            photos: place.photos,
            reviews: place.reviews,
          });

          // Build photo URLs
          const urls: string[] = [];
          if (place.photos && place.photos.length > 0) {
            place.photos.slice(0, 5).forEach((photo) => {
              urls.push(photo.getUrl({ maxWidth: 800 }));
            });
          }
          if (urls.length === 0 && activity.photo_url) {
            urls.push(activity.photo_url);
          }
          setPhotoUrls(urls);
          setPhotoIndex(0);
        } else {
          setPlaceDetails(null);
          setPhotoUrls(activity.photo_url ? [activity.photo_url] : []);
          setPhotoIndex(0);
        }
      }
    );
  }, [isOpen, activity]);

  const handlePrevPhoto = useCallback(() => {
    setPhotoIndex((prev) =>
      prev > 0 ? prev - 1 : photoUrls.length - 1
    );
  }, [photoUrls.length]);

  const handleNextPhoto = useCallback(() => {
    setPhotoIndex((prev) =>
      prev < photoUrls.length - 1 ? prev + 1 : 0
    );
  }, [photoUrls.length]);

  if (!isOpen || !activity) return null;

  const color = getMarkerColor(activity.type);
  const activityDate = new Date(activity.date);
  const dateStr = activityDate.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  // Opening hours helpers
  const todayIndex = new Date().getDay();
  const isOpenNow = placeDetails?.opening_hours?.isOpen?.();
  const weekdayText = placeDetails?.opening_hours?.weekday_text;
  // Google returns weekday_text Mon-Sun (index 0=Mon), JS getDay() 0=Sun
  const todayWeekdayTextIndex = todayIndex === 0 ? 6 : todayIndex - 1;
  const todayHours = weekdayText?.[todayWeekdayTextIndex];

  // Price level display
  const priceLevelStr = placeDetails?.price_level
    ? "¥".repeat(placeDetails.price_level)
    : null;

  // Numbered marker SVG for mini map
  const createMarkerIcon = () => {
    const svg = `
      <svg width="30" height="40" viewBox="0 0 30 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 0C6.716 0 0 6.716 0 15c0 8.284 15 25 15 25s15-16.716 15-25C30 6.716 23.284 0 15 0z" fill="${color}"/>
        <circle cx="15" cy="15" r="12" fill="white"/>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 sm:inset-4 md:inset-y-4 md:inset-x-0 md:max-w-lg md:mx-auto bg-white sm:rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* Photo header */}
          <div className="relative w-full h-56 sm:h-64">
            {photoUrls.length > 0 ? (
              <>
                <img
                  src={photoUrls[photoIndex]}
                  alt={activity.name}
                  className="w-full h-full object-cover"
                />
                {/* Photo navigation */}
                {photoUrls.length > 1 && (
                  <>
                    <button
                      onClick={handlePrevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-1.5 text-white transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleNextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 rounded-full p-1.5 text-white transition-colors"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    {/* Photo indicators */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {photoUrls.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPhotoIndex(i)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            i === photoIndex
                              ? "bg-white scale-110"
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              /* 種別イラストのフォールバック */
              <Image
                src={getActivityTypeImage(activity.type, { motion: true })}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            )}
          </div>

          {/* Title section */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {activity.name}
                </h2>
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                    style={{ backgroundColor: color }}
                  >
                    {getTypeLabel(activity.type)}
                  </span>
                  <span className="text-sm text-gray-500">
                    {dateStr} {formatTime(activity.time)}
                  </span>
                </div>
                {(placeDetails?.formatted_address || activity.location) && (
                  <p className="text-sm text-gray-500 mt-1.5">
                    {placeDetails?.formatted_address || activity.location}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick info (Google Places data) */}
          {placeDetails && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-4 flex-wrap">
                {placeDetails.rating != null && (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(placeDetails.rating!)
                              ? "text-yellow-400"
                              : "text-gray-200"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                      {placeDetails.rating}
                    </span>
                    {placeDetails.user_ratings_total != null && (
                      <span className="text-xs text-gray-400">
                        ({placeDetails.user_ratings_total})
                      </span>
                    )}
                  </div>
                )}
                {priceLevelStr && (
                  <span className="text-sm font-medium text-gray-600">
                    {priceLevelStr}
                  </span>
                )}
                {placeDetails.opening_hours && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isOpenNow
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {isOpenNow ? "営業中" : "営業時間外"}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Loading indicator */}
          {placeLoading && (
            <div className="px-4 pb-3">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                Google情報を取得中...
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto">
              {placeDetails?.formatted_phone_number && (
                <a
                  href={`tel:${placeDetails.formatted_phone_number}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-700 flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  電話
                </a>
              )}
              {placeDetails?.website && (
                <a
                  href={placeDetails.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-700 flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                    />
                  </svg>
                  ウェブサイト
                </a>
              )}
              {(placeDetails?.url ||
                (activity.lat && activity.lng)) && (
                <a
                  href={
                    placeDetails?.url ||
                    `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-sm text-gray-700 flex-shrink-0"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Google Maps
                </a>
              )}
              <button
                onClick={() => {
                  onClose();
                  onEdit(activity);
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors text-sm text-blue-700 flex-shrink-0"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                編集
              </button>
            </div>
          </div>

          {/* Notes */}
          {activity.notes && (
            <div className="px-4 pb-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                  メモ
                </h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {activity.notes}
                </p>
              </div>
            </div>
          )}

          {/* Opening hours */}
          {weekdayText && weekdayText.length > 0 && (
            <div className="px-4 pb-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  営業時間
                </h3>
                {todayHours && (
                  <p className="text-sm text-gray-800 font-medium mb-1">
                    {todayHours}
                  </p>
                )}
                {!hoursExpanded ? (
                  <button
                    onClick={() => setHoursExpanded(true)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    すべての営業時間を表示
                  </button>
                ) : (
                  <div className="space-y-0.5 mt-1">
                    {weekdayText.map((text, i) => (
                      <p
                        key={i}
                        className={`text-sm ${
                          i === todayWeekdayTextIndex
                            ? "text-gray-900 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {text}
                      </p>
                    ))}
                    <button
                      onClick={() => setHoursExpanded(false)}
                      className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                    >
                      閉じる
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mini map */}
          {activity.lat && activity.lng && isLoaded && (
            <div className="px-4 pb-3">
              <div className="rounded-xl overflow-hidden border border-gray-200">
                <div className="h-40 pointer-events-none">
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={{ lat: activity.lat, lng: activity.lng }}
                    zoom={15}
                    options={{
                      disableDefaultUI: true,
                      gestureHandling: "none",
                      zoomControl: false,
                      scrollwheel: false,
                      draggable: false,
                    }}
                  >
                    <Marker
                      position={{ lat: activity.lat, lng: activity.lng }}
                      icon={createMarkerIcon()}
                    />
                  </GoogleMap>
                </div>
              </div>
            </div>
          )}

          {/* Reviews */}
          {placeDetails?.reviews && placeDetails.reviews.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                レビュー
              </h3>
              <div className="space-y-3">
                {placeDetails.reviews.slice(0, 3).map((review, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      {review.profile_photo_url && (
                        <img
                          src={review.profile_photo_url}
                          alt={review.author_name}
                          className="w-6 h-6 rounded-full"
                        />
                      )}
                      <span className="text-sm font-medium text-gray-800">
                        {review.author_name}
                      </span>
                      <div className="flex ml-auto">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`w-3 h-3 ${
                              star <= (review.rating || 0)
                                ? "text-yellow-400"
                                : "text-gray-200"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-4">
                      {review.text}
                    </p>
                    {review.relative_time_description && (
                      <p className="text-xs text-gray-400 mt-1">
                        {review.relative_time_description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailModal;
