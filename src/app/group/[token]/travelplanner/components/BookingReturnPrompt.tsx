"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarCheck, Check, X } from "lucide-react";
import { trackEvent } from "@/lib/analytics";
import { clearPendingBooking, readPendingBooking, type PendingBooking } from "@/lib/bookingReturn";
import { formatDocumentDate, useCreateTravelDocument } from "../information/documentUtils";
import { bookingNotes, extractBookingFromFile } from "@/lib/extractBooking";
import { validateFile } from "@/lib/cloudinary";

interface BookingReturnPromptProps {
  itineraryId: number;
  /** 宿の予定の名前（activityId から引く）。記録のタイトルの初期値に使う */
  activityName?: (activityId: number) => string | undefined;
  /** 記録した後。情報タブへ移るなど */
  onRecorded?: () => void;
}

/**
 * 予約サイトから戻ってきた時に「予約できましたか？」と聞き、
 * 「予約した」のワンタップで情報タブに予約の記録（宿名・宿泊日・予約サイト）を作る。
 * 予約完了画面のスクショを選べば、それを添付し、予約番号などもAIで読み取って入れる。
 * スクショが無い人は、予約番号を後から情報タブの編集で足せる。
 */
export default function BookingReturnPrompt({ itineraryId, activityName, onRecorded }: BookingReturnPromptProps) {
  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [state, setState] = useState<"ask" | "reading" | "saving" | "saved">("ask");
  const createTravelDocument = useCreateTravelDocument();

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

  // 記録できたら少し見せてから閉じる
  useEffect(() => {
    if (state !== "saved") return;
    const timer = setTimeout(() => {
      setPending(null);
      setState("ask");
    }, 6000);
    return () => clearTimeout(timer);
  }, [state]);

  if (!pending) return null;

  const title =
    (pending.activityId ? activityName?.(pending.activityId) : undefined) ?? `${pending.keyword}の宿`;
  const stay =
    pending.checkin && pending.checkout
      ? `${formatDocumentDate(pending.checkin)} 〜 ${formatDocumentDate(pending.checkout)}`
      : undefined;

  const close = () => {
    clearPendingBooking();
    setPending(null);
    setState("ask");
  };

  /** screenshot を渡すと、添付したうえで中身を読み取って予約番号などを入れる */
  const recordBooking = async (screenshot?: File) => {
    if (screenshot) {
      const v = validateFile(screenshot);
      if (!v.valid) {
        alert(v.error);
        return;
      }
    }
    trackEvent("affiliate_return", { provider: pending.provider, result: "booked", with_screenshot: Boolean(screenshot) });
    // 二重に記録しないよう、保存を始めた時点で記録を消す
    clearPendingBooking();

    let extracted = null;
    if (screenshot) {
      setState("reading");
      extracted = await extractBookingFromFile(screenshot);
      trackEvent("booking_extract", { context: "booking_return", result: extracted ? "ok" : "none" });
    }

    setState("saving");
    try {
      await createTravelDocument({
        itineraryId,
        // 宿の予定に紐づく時はその名前を優先する（一覧で予定と同じ名前の方が分かりやすい）
        title: pending.activityId ? title : extracted?.title || title,
        category: "hotel",
        date: extracted?.date || pending.checkin || null,
        activityId: pending.activityId ?? null,
        files: screenshot ? [screenshot] : [],
        reservationNumber: extracted?.reservationNumber,
        notes:
          (extracted && bookingNotes(extracted)) ||
          [`${pending.providerLabel}で予約`, stay].filter(Boolean).join("\n"),
      });
      trackEvent("affiliate_booking_recorded", { provider: pending.provider, with_screenshot: Boolean(screenshot) });
      setState("saved");
    } catch (error) {
      console.error("予約の記録に失敗しました:", error);
      alert(`予約の記録に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
      setState("ask");
    }
  };

  const notYet = () => {
    trackEvent("affiliate_return", { provider: pending.provider, result: "not_yet" });
    close();
  };

  return (
    <div className="fixed inset-x-0 bottom-20 lg:bottom-6 z-50 px-4 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-violet-100 bg-white shadow-xl p-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
              state === "saved" ? "bg-emerald-50 text-emerald-600" : "bg-violet-50 text-violet-600"
            }`}
          >
            {state === "saved" ? (
              <Check className="w-5 h-5" aria-hidden="true" />
            ) : (
              <CalendarCheck className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-gray-800">
              {state === "saved" ? "情報タブに記録しました" : `${pending.providerLabel}で予約できましたか？`}
            </p>
            <p className="mt-0.5 text-xs text-gray-500 truncate">
              {title}
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
          {state === "saved" ? (
            <button
              type="button"
              onClick={() => {
                close();
                onRecorded?.();
              }}
              className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2.5"
            >
              情報タブで見る（予約番号も追加できます）
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => recordBooking()}
                disabled={state !== "ask"}
                className="flex-1 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium py-2.5"
              >
                {state === "reading" ? "読み取り中..." : state === "saving" ? "記録中..." : "予約した"}
              </button>
              <button
                type="button"
                onClick={notYet}
                disabled={state !== "ask"}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium px-4 py-2.5"
              >
                まだ
              </button>
            </>
          )}
        </div>
        {state === "ask" && (
          <label className="mt-2 block text-center text-xs text-violet-700 cursor-pointer hover:underline">
            📷 予約完了画面のスクショを選ぶと、予約番号まで自動で入ります
            <input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void recordBooking(file);
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
