/**
 * 予約確認のスクショ・PDFを /api/extract-booking に送り、読み取った内容を受け取る（ブラウザ側）。
 */

export interface ExtractedBooking {
  /** 予約の画面・書類だと判断されたか */
  isBooking: boolean;
  /** 情報タブのカテゴリー（hotel / flight / car / transport / ticket / insurance / other） */
  category: string;
  title: string;
  reservationNumber: string;
  /** YYYY-MM-DD。分からなければ空文字 */
  date: string;
  endDate: string;
  provider: string;
  /** 数字だけ（例: "18400"） */
  amount: string;
  currency: string;
}

const EXTRACTABLE_TYPES = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];

export const canExtract = (file: File) => EXTRACTABLE_TYPES.includes(file.type);

function groupTokenFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const match = window.location.pathname.match(/\/group\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * 読み取れなかった時（未設定・失敗・予約の画面ではない）は null を返す。
 * 呼び出し側は null なら手入力のまま進めれば良い。
 */
export async function extractBookingFromFile(file: File): Promise<ExtractedBooking | null> {
  if (!canExtract(file)) return null;
  const token = groupTokenFromUrl();
  if (!token) return null;

  const body = new FormData();
  body.append("file", file);
  try {
    const res = await fetch("/api/extract-booking", {
      method: "POST",
      headers: { "x-group-token": token },
      body,
    });
    if (!res.ok) return null;
    const result = (await res.json()) as ExtractedBooking;
    return result.isBooking ? result : null;
  } catch {
    return null;
  }
}

/** 読み取った内容から、情報のメモ欄に入れる文を作る */
export function bookingNotes(b: ExtractedBooking): string {
  const lines: string[] = [];
  if (b.provider) lines.push(`${b.provider}で予約`);
  if (b.date && b.endDate) lines.push(`${b.date} 〜 ${b.endDate}`);
  if (b.amount) {
    const n = Number(b.amount);
    const amount = Number.isFinite(n) ? n.toLocaleString("ja-JP") : b.amount;
    lines.push(`支払額: ${amount}${b.currency ? ` ${b.currency}` : ""}`);
  }
  return lines.join("\n");
}
