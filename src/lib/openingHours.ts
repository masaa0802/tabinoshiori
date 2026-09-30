/**
 * Google Places の営業時間（opening_hours.periods）と、予定の日付・時刻を照らし合わせる。
 *
 * periods は「現在の」営業時間なので、旅行日の臨時休業などは分からない。
 * 画面ではその旨を添えて表示すること。
 */

export type OpenStatus = "open" | "closed_time" | "closed_day" | "unknown";

interface PeriodPoint {
  day: number; // 0 = 日曜
  time?: string; // "HHMM"
  hours?: number;
  minutes?: number;
}

interface Period {
  open: PeriodPoint;
  close?: PeriodPoint;
}

const WEEK = 7 * 24 * 60;

const toMinutes = (p: PeriodPoint) => {
  if (typeof p.hours === "number") return p.day * 1440 + p.hours * 60 + (p.minutes ?? 0);
  const t = p.time ?? "0000";
  return p.day * 1440 + Number(t.slice(0, 2)) * 60 + Number(t.slice(2, 4));
};

/** "2026-10-01" をローカル日付として読む（new Date("2026-10-01") は UTC 扱いで曜日がずれることがある） */
export const parseLocalDate = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const checkOpenAt = (
  periods: Period[] | undefined,
  dateStr: string,
  timeStr: string
): OpenStatus => {
  if (!periods || periods.length === 0 || !dateStr || !timeStr) return "unknown";

  // close が無い期間が1つだけ = 24時間営業
  if (periods.length === 1 && !periods[0].close) return "open";

  const day = parseLocalDate(dateStr).getDay();
  const [h, m] = timeStr.split(":").map(Number);
  const at = day * 1440 + h * 60 + (m || 0);

  // 週をまたぐ期間（土曜の夜〜日曜の朝など）も扱えるよう、1週ずらした位置でも判定する
  const ranges = periods.map(({ open, close }) => {
    const start = toMinutes(open);
    let end = close ? toMinutes(close) : start + 1440;
    if (end <= start) end += WEEK;
    return [start, end] as const;
  });
  const covers = (t: number) => ranges.some(([s, e]) => (t >= s && t < e) || (t + WEEK >= s && t + WEEK < e));

  if (covers(at)) return "open";

  const dayStart = day * 1440;
  const openSomeTimeThatDay = ranges.some(([s, e]) =>
    [0, WEEK].some((shift) => s < dayStart + 1440 + shift && e > dayStart + shift)
  );
  return openSomeTimeThatDay ? "closed_time" : "closed_day";
};

/** weekday_text（月曜始まり）から、その日付の行を取り出す。「月曜日: 」などの曜日部分は落とす */
export const hoursTextFor = (weekdayText: string[] | undefined, dateStr: string) => {
  if (!weekdayText || weekdayText.length !== 7 || !dateStr) return undefined;
  const day = parseLocalDate(dateStr).getDay();
  const line = weekdayText[day === 0 ? 6 : day - 1];
  return line?.replace(/^[^:：]+[:：]\s*/, "");
};
