"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, X } from "lucide-react";
import { validateFile } from "@/lib/cloudinary";
import { trackEvent } from "@/lib/analytics";
import { clearPendingBooking, readPendingBooking, type PendingBooking } from "@/lib/bookingReturn";
import { MAX_DOCUMENT_FILES, formatDocumentDate, useCreateTravelDocument } from "../information/documentUtils";

interface BookingReturnPromptProps {
  itineraryId: number;
  /** 宿の予定の名前（activityId から引く）。記録のタイトルの初期値に使う */
  activityName?: (activityId: number) => string | undefined;
  /** 記録した後。情報タブへ移るなど */
  onRecorded?: () => void;
}

/**
 * 予約サイトから戻ってきた時に「予約できましたか？」と聞き、
 * 予約できていれば情報タブに予約の記録（宿名・日付・予約番号・確認画面）を作る。
 */
export default function BookingReturnPrompt({ itineraryId, activityName, onRecorded }: BookingReturnPromptProps) {
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [recording, setRecording] = useState(false);

  const check = useCallback(() => {
    if (document.visibilityState !== "visible") return;
    const found = readPendingBooking(itineraryId);
    if (found) setPending((current) => current ?? found);
  }, [itineraryId]);

  useEffect(() => {
    check();
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    return () => {
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
    };
  }, [check]);

  if (!pending) return null;

  const answer = (result: "booked" | "not_yet") => {
    trackEvent("affiliate_return", { provider: pending.provider, result });
    if (result === "booked") {
      setRecording(true);
    } else {
      clearPendingBooking();
      setPending(null);
    }
  };

  const close = () => {
    clearPendingBooking();
    setPending(null);
    setRecording(false);
  };

  const defaultTitle =
    (pending.activityId ? activityName?.(pending.activityId) : undefined) ?? `${pending.keyword}の宿`;

  if (recording) {
    return (
      <RecordBookingModal
        itineraryId={itineraryId}
        pending={pending}
        defaultTitle={defaultTitle}
        onClose={close}
        onRecorded={() => {
          trackEvent("affiliate_booking_recorded", { provider: pending.provider });
          close();
          onRecorded?.();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-50 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-violet-100 bg-white shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0">
            <CalendarCheck className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">{pending.providerLabel}で予約できましたか？</p>
            <p className="mt-0.5 text-xs text-gray-500 truncate">
              {defaultTitle}
              {pending.checkin && ` ・ ${formatDocumentDate(pending.checkin)}から`}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="p-1 -m-1 text-gray-400 hover:text-gray-600"
            aria-label="閉じる"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => answer("booked")}
            className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium py-2.5"
          >
            予約した。情報タブに記録する
          </button>
          <button
            type="button"
            onClick={() => answer("not_yet")}
            className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5"
          >
            まだ
          </button>
        </div>
      </div>
    </div>
  );
}

interface RecordBookingModalProps {
  itineraryId: number;
  pending: PendingBooking;
  defaultTitle: string;
  onClose: () => void;
  onRecorded: () => void;
}

/** 予約の記録を情報タブ（カテゴリー: ホテル）に1件作る。予約番号か確認画面のどちらかがあれば保存できる */
function RecordBookingModal({ itineraryId, pending, defaultTitle, onClose, onRecorded }: RecordBookingModalProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [reservationNumber, setReservationNumber] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const createTravelDocument = useCreateTravelDocument();

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (next.length >= MAX_DOCUMENT_FILES) {
        alert(`ファイルは最大${MAX_DOCUMENT_FILES}個まで追加できます`);
        break;
      }
      const v = validateFile(file);
      if (!v.valid) {
        alert(v.error);
        continue;
      }
      next.push(file);
    }
    setFiles(next);
  };

  const canSave = Boolean(reservationNumber.trim() || files.length > 0) && !saving;

  const stay =
    pending.checkin && pending.checkout
      ? `${formatDocumentDate(pending.checkin)} 〜 ${formatDocumentDate(pending.checkout)}`
      : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      await createTravelDocument({
        itineraryId,
        title: title.trim() || defaultTitle,
        category: "hotel",
        date: pending.checkin ?? null,
        activityId: pending.activityId ?? null,
        files,
        reservationNumber,
        notes: [`${pending.providerLabel}で予約`, stay].filter(Boolean).join("\n"),
      });
      onRecorded();
    } catch (error) {
      console.error("予約の記録に失敗しました:", error);
      alert(`予約の記録に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto"
      >
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-5 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">予約を記録する</h2>
          <button type="button" onClick={onClose} className="text-white/80 hover:text-white" aria-label="閉じる">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-gray-500">
            情報タブの「ホテル」に保存します。{pending.providerLabel}の予約確認メールや画面から写してください。
          </p>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">宿の名前</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </label>

          {stay && (
            <div>
              <span className="text-sm font-medium text-gray-700">宿泊日</span>
              <p className="mt-1 text-sm text-gray-600">{stay}</p>
            </div>
          )}

          <label className="block">
            <span className="text-sm font-medium text-gray-700">予約番号</span>
            <input
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              inputMode="text"
              autoComplete="off"
              placeholder="例: 1234567890"
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </label>

          <div>
            <span className="text-sm font-medium text-gray-700">
              予約確認のスクショ・PDF <span className="text-gray-400 font-normal">（任意）</span>
            </span>
            <label className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-violet-200 py-3 text-xs font-medium text-violet-600 cursor-pointer hover:bg-violet-50">
              ＋ ファイルを選ぶ
              <input
                type="file"
                accept="image/*,application/pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            {files.length > 0 && (
              <ul className="mt-2 space-y-1">
                {files.map((f, i) => (
                  <li key={`${f.name}-${i}`} className="flex items-center justify-between text-xs text-gray-600">
                    <span className="truncate">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="ml-2 text-gray-400 hover:text-red-500"
                    >
                      削除
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <p className="text-[11px] text-gray-400">予約番号か確認ファイルのどちらかがあれば保存できます。</p>

          <button
            type="submit"
            disabled={!canSave}
            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-medium py-3"
          >
            {saving ? "保存中..." : "情報タブに保存する"}
          </button>
        </div>
      </form>
    </div>
  );
}
