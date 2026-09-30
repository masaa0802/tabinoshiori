"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { useQuery } from "@apollo/client";
import { useGoogleMaps } from "@/components/GoogleMapsProvider";
import { getActivityTypeImage } from "@/lib/activityTypeImage";
import { checkOpenAt, hoursTextFor, parseLocalDate, type OpenStatus } from "@/lib/openingHours";
import { GET_BUDGETS } from "@/graphql/queries";

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

interface Budget {
  id: number;
  activity_id?: number | null;
  category: string;
  amount: number;
  description?: string;
  currency?: string;
}

interface PlaceDetails {
  formatted_address?: string;
  formatted_phone_number?: string;
  opening_hours?: google.maps.places.PlaceOpeningHours;
  website?: string;
  url?: string;
}

interface ActivityDetailSheetProps {
  activity: Activity | null;
  isOpen: boolean;
  /** 旅程のアクティビティ全件（前後の予定を出すのに使う） */
  tripActivities: Activity[];
  /** 旅行の初日（「◯日目」の計算に使う） */
  tripStartDate?: string;
  onClose: () => void;
  onEdit: (activity: Activity) => void;
  onDelete: (activity: Activity) => void;
  /** 「予算で追加・編集」を押した時。予算タブへ移る */
  onOpenBudget?: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  transport:   { label: "交通",   color: "#3B82F6" },
  sightseeing: { label: "観光",   color: "#10B981" },
  restaurant:  { label: "ごはん", color: "#F59E0B" },
  hotel:       { label: "宿",     color: "#8B5CF6" },
  activity:    { label: "あそび", color: "#EF4444" },
  area:        { label: "エリア", color: "#6B7280" },
};

const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  transport: "交通費",
  sightseeing: "観光",
  restaurant: "食事",
  food: "食事",
  hotel: "宿泊",
  activity: "アクティビティ",
  shopping: "買い物",
  area: "その他",
  other: "その他",
};

/**
 * 開いた直後のバックドロップのクリックは無視する。
 * スマホではカードのタップで開いた後に遅れて届く click が、
 * 開いたばかりのバックドロップに当たってすぐ閉じてしまうため。
 */
const BACKDROP_GUARD_MS = 400;

const formatDate = (dateStr: string) =>
  parseLocalDate(dateStr).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });

const formatTime = (timeStr: string) => timeStr?.substring(0, 5) ?? "";

const toMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + (m || 0);
};

const formatDuration = (minutes: number) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}分`;
  return m === 0 ? `${h}時間` : `${h}時間${m}分`;
};

const formatYen = (amount: number, currency?: string) =>
  !currency || currency === "JPY" ? `¥${amount.toLocaleString()}` : `${amount.toLocaleString()} ${currency}`;

const sortKey = (a: Activity) => `${a.date} ${a.time}`;

const OPEN_STATUS_VIEW: Record<Exclude<OpenStatus, "unknown">, { text: string; tone: string; mark: string }> = {
  open:        { text: "予定の時間は営業中です",     tone: "bg-emerald-50 text-emerald-800 border-emerald-200", mark: "✓" },
  closed_time: { text: "予定の時間は営業時間外です", tone: "bg-amber-50 text-amber-800 border-amber-200",       mark: "!" },
  closed_day:  { text: "この日は定休日のようです",   tone: "bg-rose-50 text-rose-800 border-rose-200",          mark: "!" },
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-xs font-bold tracking-widest text-stone-500 mb-2">
      <span className="w-1 h-3.5 rounded-full bg-stone-400" />
      {children}
    </h3>
  );
}

const ActivityDetailSheet: React.FC<ActivityDetailSheetProps> = ({
  activity,
  isOpen,
  tripActivities,
  tripStartDate,
  onClose,
  onEdit,
  onDelete,
  onOpenBudget,
}) => {
  const [visible, setVisible] = useState(false);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const { isLoaded } = useGoogleMaps();

  const { data: budgetsData } = useQuery(GET_BUDGETS, {
    variables: { itinerary_id: activity?.itinerary_id },
    skip: !isOpen || !activity,
    fetchPolicy: "cache-and-network",
  });

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
  }, [activity?.id]);

  useEffect(() => {
    if (isLoaded && window.google?.maps?.places && !placesService.current) {
      placesService.current = new window.google.maps.places.PlacesService(document.createElement("div"));
    }
  }, [isLoaded]);

  // 営業時間の照合とスポット情報に使う分だけ Google から取る
  useEffect(() => {
    setPlaceDetails(null);
    if (!isOpen || !activity?.place_id || !isLoaded || !placesService.current) return;

    let cancelled = false;
    placesService.current.getDetails(
      {
        placeId: activity.place_id,
        fields: ["formatted_address", "formatted_phone_number", "opening_hours", "utc_offset_minutes", "website", "url"],
        language: "ja",
      },
      (place, status) => {
        if (cancelled) return;
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          setPlaceDetails({
            formatted_address: place.formatted_address,
            formatted_phone_number: place.formatted_phone_number,
            opening_hours: place.opening_hours,
            website: place.website,
            url: place.url,
          });
        }
      }
    );
    return () => {
      cancelled = true;
    };
  }, [isOpen, activity?.place_id, isLoaded]);

  // 旅程全体を日時順に並べ、前後の予定を探す
  const { prev, next } = useMemo(() => {
    if (!activity) return { prev: undefined, next: undefined };
    const sorted = tripActivities.slice().sort((a, b) => sortKey(a).localeCompare(sortKey(b)));
    const index = sorted.findIndex((a) => a.id === activity.id);
    if (index === -1) return { prev: undefined, next: undefined };
    return { prev: sorted[index - 1], next: sorted[index + 1] };
  }, [tripActivities, activity]);

  if (!isOpen || !activity) return null;

  const config = TYPE_CONFIG[activity.type] ?? TYPE_CONFIG.area;

  const dayNumber = tripStartDate && activity.date
    ? Math.round((parseLocalDate(activity.date).getTime() - parseLocalDate(tripStartDate).getTime()) / 86_400_000) + 1
    : undefined;

  const untilNext = next && next.date === activity.date && next.time && activity.time
    ? toMinutes(next.time) - toMinutes(activity.time)
    : undefined;

  const budgets: Budget[] = (budgetsData?.budgets ?? []).filter((b: Budget) => b.activity_id === activity.id);
  const budgetTotal = budgets.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);

  const openStatus = checkOpenAt(placeDetails?.opening_hours?.periods, activity.date, activity.time);
  const hoursText = hoursTextFor(placeDetails?.opening_hours?.weekday_text, activity.date);

  const googleMapsUrl = placeDetails?.url
    ?? (activity.lat && activity.lng
      ? `https://www.google.com/maps/search/?api=1&query=${activity.lat},${activity.lng}${activity.place_id ? `&query_place_id=${activity.place_id}` : ""}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location || activity.name)}`);

  // Google の住所は「日本、〒…」で始まるので国名を落とす
  const address = placeDetails?.formatted_address?.replace(/^日本、\s*/, "") || activity.location;
  const hasSpotInfo = address || placeDetails?.formatted_phone_number || placeDetails?.website;

  const handleBackdropClick = () => {
    if (Date.now() - openedAtRef.current < BACKDROP_GUARD_MS) return;
    onClose();
  };

  // 切符の下段に出す前後の予定。別の日なら日付も添える
  const stubRow = (label: string, a: Activity, emphasis: boolean, note?: string) => (
    <div className={`flex items-baseline gap-2 ${emphasis ? "text-sm text-stone-800" : "text-xs text-stone-400"}`}>
      <span
        className={`flex-shrink-0 rounded px-1.5 py-px text-[10px] font-bold ${emphasis ? "text-white" : "bg-stone-100 text-stone-500"}`}
        style={emphasis ? { backgroundColor: config.color } : undefined}
      >
        {label}
      </span>
      <span className="flex-shrink-0 font-mono tabular-nums">
        {a.date !== activity.date && <span className="mr-1">{formatDate(a.date)}</span>}
        {formatTime(a.time)}
      </span>
      <span className={`flex-1 min-w-0 truncate ${emphasis ? "font-bold" : ""}`}>{a.name}</span>
      {note && <span className="flex-shrink-0 text-xs text-stone-500">{note}</span>}
    </div>
  );

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
          relative w-full bg-[#FBF8F1] text-stone-800 flex flex-col overflow-hidden
          h-[100dvh] md:h-auto md:max-h-[88vh] md:max-w-lg md:mx-4 md:rounded-2xl
          transition-all duration-300 ease-out
          ${visible ? "translate-y-0 md:scale-100 md:opacity-100" : "translate-y-full md:translate-y-0 md:scale-95 md:opacity-0"}
        `}
      >
        {/* 閉じるボタン（スクロールしても常に押せる位置に固定） */}
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="absolute right-3 top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 w-10 h-10 bg-black/35 hover:bg-black/55 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {/* ヘッダーイラスト（種別ごとに固定。写真は使わない） */}
          <div className="relative h-48 md:h-44 overflow-hidden">
            <Image
              src={getActivityTypeImage(activity, { motion: true })}
              alt=""
              fill
              unoptimized
              className="object-cover"
            />
          </div>

          {/* 切符 */}
          <div className="relative -mt-8 mx-4">
            <div className="relative bg-white rounded-2xl shadow-[0_6px_20px_-8px_rgba(60,50,30,0.35)]">
              <div className="p-5 pb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium tracking-wide text-stone-500">
                      {dayNumber !== undefined && <span className="mr-2 font-bold" style={{ color: config.color }}>{dayNumber}日目</span>}
                      {activity.date && formatDate(activity.date)}
                    </p>
                    <p className="mt-1 text-4xl font-bold font-mono tabular-nums leading-none tracking-tight">
                      {formatTime(activity.time)}
                    </p>
                  </div>
                  {/* スタンプ */}
                  <div
                    className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-dashed flex items-center justify-center -rotate-12"
                    style={{ borderColor: config.color, color: config.color }}
                  >
                    <div className="w-12 h-12 rounded-full border flex items-center justify-center text-xs font-bold" style={{ borderColor: config.color }}>
                      {config.label}
                    </div>
                  </div>
                </div>
                <h2 className="mt-3 text-xl font-bold leading-snug break-words">{activity.name}</h2>
              </div>

              {/* 切り取り線 */}
              <div className="relative h-4">
                <div className="absolute left-4 right-4 top-1/2 border-t-2 border-dashed border-stone-200" />
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-[#FBF8F1]" />
                <div className="absolute -right-2 top-0 w-4 h-4 rounded-full bg-[#FBF8F1]" />
              </div>

              <div className="px-5 py-3 space-y-1.5">
                {prev && stubRow("前", prev, false)}
                {next ? (
                  stubRow(
                    "次",
                    next,
                    true,
                    untilNext !== undefined && untilNext > 0 ? `あと${formatDuration(untilNext)}` : undefined
                  )
                ) : (
                  <p className="text-sm text-stone-600">旅の最後の予定です</p>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 pt-6 pb-4 space-y-6">
            {/* 営業時間チェック */}
            {openStatus !== "unknown" && (
              <section>
                <SectionTitle>営業時間チェック</SectionTitle>
                <div className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 ${OPEN_STATUS_VIEW[openStatus].tone}`}>
                  <span className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full border border-current flex items-center justify-center text-xs font-bold">
                    {OPEN_STATUS_VIEW[openStatus].mark}
                  </span>
                  <div className="text-sm">
                    <p className="font-bold">{OPEN_STATUS_VIEW[openStatus].text}</p>
                    {hoursText && (
                      <p className="mt-0.5 text-xs opacity-80">
                        {activity.date && formatDate(activity.date)}の営業時間: {hoursText}
                      </p>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-stone-400">Google の現在の営業時間をもとに判定しています。臨時休業などは反映されません。</p>
              </section>
            )}

            {/* 費用 */}
            <section>
              <SectionTitle>この予定の費用</SectionTitle>
              {budgets.length > 0 ? (
                <div className="bg-white rounded-xl px-4 py-3">
                  <ul className="space-y-1.5">
                    {budgets.map((b) => (
                      <li key={b.id} className="flex items-baseline gap-2 text-sm">
                        <span className="min-w-0 truncate text-stone-600">
                          {b.description || BUDGET_CATEGORY_LABELS[b.category] || b.category}
                        </span>
                        <span className="flex-1 border-b border-dotted border-stone-300" />
                        <span className="font-mono tabular-nums">{formatYen(Number(b.amount) || 0, b.currency)}</span>
                      </li>
                    ))}
                  </ul>
                  {budgets.length > 1 && (
                    <div className="mt-2 pt-2 border-t border-stone-200 flex justify-between text-sm font-bold">
                      <span>合計</span>
                      <span className="font-mono tabular-nums">{formatYen(budgetTotal, budgets[0].currency)}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-stone-400">まだ登録されていません。</p>
              )}
              {onOpenBudget && (
                <button type="button" onClick={onOpenBudget} className="mt-2 text-xs font-medium text-blue-600">
                  予算で追加・編集する →
                </button>
              )}
            </section>

            {/* メモ */}
            {activity.notes && (
              <section>
                <SectionTitle>メモ</SectionTitle>
                <div className="relative bg-[#FFF6D8] rounded-lg px-4 py-3 shadow-sm -rotate-[0.6deg]">
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-14 h-4 bg-white/70 rotate-2" />
                  <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed break-words">{activity.notes}</p>
                </div>
              </section>
            )}

            {/* スポット情報（控えめに） */}
            {hasSpotInfo && (
              <section>
                <SectionTitle>スポット情報</SectionTitle>
                <dl className="text-sm space-y-1.5">
                  {address && (
                    <div className="flex gap-3">
                      <dt className="w-12 flex-shrink-0 text-stone-400 text-xs pt-0.5">住所</dt>
                      <dd className="flex-1 min-w-0 break-words text-stone-700">{address}</dd>
                    </div>
                  )}
                  {placeDetails?.formatted_phone_number && (
                    <div className="flex gap-3">
                      <dt className="w-12 flex-shrink-0 text-stone-400 text-xs pt-0.5">電話</dt>
                      <dd><a href={`tel:${placeDetails.formatted_phone_number}`} className="text-blue-600">{placeDetails.formatted_phone_number}</a></dd>
                    </div>
                  )}
                  {placeDetails?.website && (
                    <div className="flex gap-3">
                      <dt className="w-12 flex-shrink-0 text-stone-400 text-xs pt-0.5">サイト</dt>
                      <dd className="flex-1 min-w-0">
                        <a href={placeDetails.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 break-all">
                          {placeDetails.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </section>
            )}
          </div>
        </div>

        {/* アクションボタン（下部に固定） */}
        <div className="flex-shrink-0 border-t border-stone-200 bg-[#FBF8F1] px-4 pt-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] flex gap-2">
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-[2] flex items-center justify-center gap-2 py-3 bg-stone-800 hover:bg-stone-900 text-white rounded-xl font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            地図で開く
          </a>
          <button
            type="button"
            onClick={() => onEdit(activity)}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 rounded-xl font-medium text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            編集
          </button>
          <button
            type="button"
            onClick={() => onDelete(activity)}
            aria-label="削除"
            className="w-12 flex items-center justify-center border border-rose-200 bg-white hover:bg-rose-50 text-rose-500 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetailSheet;
