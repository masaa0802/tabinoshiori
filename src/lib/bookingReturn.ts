/**
 * 予約サイトへ移動した記録（「予約できましたか？」と聞くため）。
 *
 * アフィリエイトでは予約の中身は返ってこないので、予約ボタンを押した時に
 * 「どのしおりの、どの宿を、いつで探しに行ったか」をブラウザに残しておき、
 * しおりに戻ってきた時にそれを元に情報タブへ記録してもらう。
 *
 * localStorage が使えない環境（プライベートブラウズ等）では黙って何もしない。
 */

const STORAGE_KEY = "shiori_pending_booking";

/** 押してからこれより早く戻ってきた時は、まだ予約していないとみなして聞かない */
const MIN_AWAY_MS = 15_000;
/** これより時間が経った記録は捨てる */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface PendingBooking {
  itineraryId: number;
  /** 紐づける宿の予定。日ごとの導線から来た時は無い */
  activityId?: number | null;
  provider: string;
  /** 予約サイト名（「Trip.com」など） */
  providerLabel: string;
  keyword: string;
  checkin?: string;
  checkout?: string;
  /** 押した時刻（ms） */
  at: number;
}

export function savePendingBooking(booking: Omit<PendingBooking, "at">): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...booking, at: Date.now() }));
  } catch {
    // 保存できなくても予約サイトへの移動は妨げない
  }
}

/** このしおりについて「予約できた？」と聞くべき記録があれば返す */
export function readPendingBooking(itineraryId: number, now = Date.now()): PendingBooking | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const booking = JSON.parse(raw) as PendingBooking;
    if (typeof booking?.at !== "number" || now - booking.at > MAX_AGE_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (booking.itineraryId !== itineraryId) return null;
    if (now - booking.at < MIN_AWAY_MS) return null;
    return booking;
  } catch {
    return null;
  }
}

export function clearPendingBooking(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 何もしない
  }
}
