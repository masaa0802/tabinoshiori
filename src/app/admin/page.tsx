'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { adminQuery } from '@/lib/admin/graphql-client';
import type { TrendPoint } from './components/TrendChart';

// SSR無効（Rechartsはブラウザのみ）
const TrendChart = dynamic(() => import('./components/TrendChart'), { ssr: false });
const DestinationChart = dynamic(() => import('./components/DestinationChart'), { ssr: false });
const PurposeChart = dynamic(() => import('./components/PurposeChart'), { ssr: false });
const MonthlyChart = dynamic(() => import('./components/MonthlyChart'), { ssr: false });

// ────────────────────────────────────────────────────────────
// 型
// ────────────────────────────────────────────────────────────

interface DashboardStats {
  groups_aggregate: { aggregate: { count: number } };
  activities_aggregate: { aggregate: { count: number } };
  itineraries_aggregate: { aggregate: { count: number } };
  budgets_aggregate: { aggregate: { count: number } };
}

interface TrendDataResult {
  groups: { created_at: string }[];
  activities: { created_at: string }[];
}

interface ChartDataResult {
  itineraries: { destination: string | null; travel_purpose: string | null; start_date: string }[];
}

// ────────────────────────────────────────────────────────────
// ユーティリティ
// ────────────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '7日間', days: 7 },
  { label: '30日間', days: 30 },
  { label: '90日間', days: 90 },
  { label: '1年間', days: 365 },
] as const;

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function countOccurrences(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

/** created_at の配列を日付ごとにカウント */
function aggregateByDay(
  timestamps: string[],
  start: Date,
  days: number
): Record<string, number> {
  const map: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    map[toDateStr(addDays(start, i))] = 0;
  }
  for (const ts of timestamps) {
    const day = ts.slice(0, 10);
    if (day in map) map[day]++;
  }
  return map;
}

/** 変化率（%）を計算 */
function calcChange(current: number, prev: number): number | null {
  if (prev === 0) return null;
  return Math.round(((current - prev) / prev) * 100);
}

// ────────────────────────────────────────────────────────────
// サブコンポーネント
// ────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  change,
}: {
  label: string;
  value: number;
  change?: number | null;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
      {change != null && (
        <p
          className={`text-xs mt-1 font-medium ${
            change >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%（前期間比）
        </p>
      )}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <h3 className="font-bold text-gray-800 mb-4 text-sm">{title}</h3>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// メインページ
// ────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  // 期間設定
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [compare, setCompare] = useState(false);

  // データ
  const [totalStats, setTotalStats] = useState<DashboardStats | null>(null);
  const [periodGroupCount, setPeriodGroupCount] = useState<number | null>(null);
  const [periodActivityCount, setPeriodActivityCount] = useState<number | null>(null);
  const [prevGroupCount, setPrevGroupCount] = useState<number | null>(null);
  const [prevActivityCount, setPrevActivityCount] = useState<number | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [destinations, setDestinations] = useState<{ name: string; count: number }[]>([]);
  const [purposes, setPurposes] = useState<{ name: string; value: number }[]>([]);
  const [monthly, setMonthly] = useState<{ month: string; count: number }[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 現在の期間の start/end を計算
  const getPeriodRange = useCallback(() => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    if (useCustom && customStart && customEnd) {
      return {
        start: new Date(customStart + 'T00:00:00'),
        end: new Date(customEnd + 'T23:59:59'),
        days: Math.ceil(
          (new Date(customEnd).getTime() - new Date(customStart).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1,
      };
    }
    const start = addDays(end, -periodDays + 1);
    start.setHours(0, 0, 0, 0);
    return { start, end, days: periodDays };
  }, [periodDays, useCustom, customStart, customEnd]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { start, end, days } = getPeriodRange();
      const prevEnd = addDays(start, -1);
      const prevStart = addDays(prevEnd, -days + 1);

      // 1. 全体統計（累計）
      const statsData = await adminQuery<DashboardStats>(
        'DashboardStats',
        `query DashboardStats {
          groups_aggregate { aggregate { count } }
          activities_aggregate { aggregate { count } }
          itineraries_aggregate { aggregate { count } }
          budgets_aggregate { aggregate { count } }
        }`
      );
      setTotalStats(statsData);

      // 2. 期間内トレンドデータ（グループ・アクティビティ）
      const [trendResult, prevTrendResult] = await Promise.all([
        adminQuery<TrendDataResult>(
          'TrendData',
          `query TrendData($start: timestamptz!, $end: timestamptz!) {
            groups(where: { created_at: { _gte: $start, _lte: $end } }) { created_at }
            activities(where: { created_at: { _gte: $start, _lte: $end } }) { created_at }
          }`,
          { start: start.toISOString(), end: end.toISOString() }
        ),
        compare
          ? adminQuery<TrendDataResult>(
              'TrendData',
              `query TrendData($start: timestamptz!, $end: timestamptz!) {
                groups(where: { created_at: { _gte: $start, _lte: $end } }) { created_at }
                activities(where: { created_at: { _gte: $start, _lte: $end } }) { created_at }
              }`,
              { start: prevStart.toISOString(), end: prevEnd.toISOString() }
            )
          : Promise.resolve(null),
      ]);

      // 期間集計
      const groupsByDay = aggregateByDay(
        trendResult.groups.map((g) => g.created_at),
        start,
        days
      );
      const activitiesByDay = aggregateByDay(
        trendResult.activities.map((a) => a.created_at),
        start,
        days
      );

      setPeriodGroupCount(trendResult.groups.length);
      setPeriodActivityCount(trendResult.activities.length);

      // 前期間集計
      let prevGroupsByDay: Record<string, number> = {};
      let prevActivitiesByDay: Record<string, number> = {};
      if (prevTrendResult) {
        prevGroupsByDay = aggregateByDay(
          prevTrendResult.groups.map((g) => g.created_at),
          prevStart,
          days
        );
        prevActivitiesByDay = aggregateByDay(
          prevTrendResult.activities.map((a) => a.created_at),
          prevStart,
          days
        );
        setPrevGroupCount(prevTrendResult.groups.length);
        setPrevActivityCount(prevTrendResult.activities.length);
      } else {
        setPrevGroupCount(null);
        setPrevActivityCount(null);
      }

      // トレンドポイント構築（前期間は日付をずらして同じ軸に乗せる）
      const dateKeys = Object.keys(groupsByDay).sort();
      const prevDateKeys = Object.keys(prevGroupsByDay).sort();
      const points: TrendPoint[] = dateKeys.map((date, i) => ({
        date,
        groups: groupsByDay[date],
        activities: activitiesByDay[date],
        ...(compare && prevDateKeys[i] != null
          ? {
              prevGroups: prevGroupsByDay[prevDateKeys[i]],
              prevActivities: prevActivitiesByDay[prevDateKeys[i]],
            }
          : {}),
      }));
      setTrendData(points);

      // 3. チャートデータ（目的地・旅の目的・月別分布）
      const chartResult = await adminQuery<ChartDataResult>(
        'ChartData',
        `query ChartData {
          itineraries {
            destination
            travel_purpose
            start_date
          }
        }`
      );

      const destCounts = countOccurrences(
        chartResult.itineraries
          .flatMap((i) =>
            (i.destination ?? '')
              .split(',')
              .map((d) => d.trim())
              .filter(Boolean)
          )
      );
      setDestinations(
        Object.entries(destCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count }))
      );

      const PURPOSE_LABELS: Record<string, string> = {
        accommodation: '宿泊',
        relaxation: 'リラックス',
        newAtmosphere: '新しい雰囲気',
        scenery: '景色',
        gourmet: 'グルメ',
        activity: 'アクティビティ',
        culture: '文化・歴史',
        shopping: 'ショッピング',
        sightseeing: '観光',
        nature: '自然',
        adventure: '冒険',
        relax: 'リラックス',
        food: '食事',
        sports: 'スポーツ',
        business: 'ビジネス',
      };
      const purposeCounts = countOccurrences(
        chartResult.itineraries.flatMap((i) =>
          (i.travel_purpose ?? '')
            .split(',')
            .map((p) => p.trim())
            .filter(Boolean)
        )
      );
      setPurposes(
        Object.entries(purposeCounts)
          .sort(([, a], [, b]) => b - a)
          .map(([key, value]) => ({ name: PURPOSE_LABELS[key] ?? key, value }))
      );

      const monthCounts: Record<string, number> = {};
      for (const { start_date } of chartResult.itineraries) {
        if (!start_date) continue;
        const m = start_date.slice(0, 7); // "YYYY-MM"
        monthCounts[m] = (monthCounts[m] ?? 0) + 1;
      }
      setMonthly(
        Object.entries(monthCounts)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-12)
          .map(([month, count]) => ({ month: month.slice(2), count })) // "YY-MM"
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [getPeriodRange, compare]);

  useEffect(() => {
    load();
  }, [load]);

  const groupChange =
    compare && prevGroupCount != null && periodGroupCount != null
      ? calcChange(periodGroupCount, prevGroupCount)
      : null;
  const activityChange =
    compare && prevActivityCount != null && periodActivityCount != null
      ? calcChange(periodActivityCount, prevActivityCount)
      : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* ── コントロールバー ── */}
      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-gray-600">期間：</span>
        {PERIOD_OPTIONS.map(({ label, days }) => (
          <button
            key={days}
            onClick={() => { setPeriodDays(days); setUseCustom(false); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !useCustom && periodDays === days
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="flex items-center gap-1 ml-1">
          <input
            type="date"
            value={customStart}
            onChange={(e) => { setCustomStart(e.target.value); setUseCustom(true); }}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700"
          />
          <span className="text-gray-400 text-sm">〜</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => { setCustomEnd(e.target.value); setUseCustom(true); }}
            className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm text-gray-700"
          />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
              className="rounded"
            />
            前の期間と比較
          </label>
        </div>
      </div>

      {/* ── エラー ── */}
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
          <p className="font-medium">データの取得に失敗しました</p>
          <p className="mt-1 font-mono text-xs">{error}</p>
        </div>
      )}

      {/* ── 概要カード ── */}
      {!error && (
        <>
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
              累計
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="総グループ数"
                value={totalStats?.groups_aggregate.aggregate.count ?? 0}
              />
              <StatCard
                label="総旅程数"
                value={totalStats?.itineraries_aggregate.aggregate.count ?? 0}
              />
              <StatCard
                label="総アクティビティ数"
                value={totalStats?.activities_aggregate.aggregate.count ?? 0}
              />
              <StatCard
                label="総予算入力数"
                value={totalStats?.budgets_aggregate.aggregate.count ?? 0}
              />
            </div>
          </div>

          {/* 期間内カード */}
          <div>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
              期間内の新規作成
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                label="新規グループ"
                value={periodGroupCount ?? 0}
                change={groupChange}
              />
              <StatCard
                label="新規アクティビティ"
                value={periodActivityCount ?? 0}
                change={activityChange}
              />
              {loading && (
                <div className="col-span-2 flex items-center text-gray-400 text-sm">
                  読み込み中...
                </div>
              )}
            </div>
          </div>

          {/* ── トレンドチャート ── */}
          <SectionCard title="グループ・アクティビティ 作成数の推移">
            <TrendChart data={trendData} compare={compare} />
          </SectionCard>

          {/* ── 2カラム ── */}
          <div className="grid md:grid-cols-2 gap-6">
            <SectionCard title="人気の目的地 Top 10">
              <DestinationChart data={destinations} />
            </SectionCard>
            <SectionCard title="旅の目的内訳">
              <PurposeChart data={purposes} />
            </SectionCard>
          </div>

          {/* ── 月別旅程分布 ── */}
          <SectionCard title="旅行予定月の分布（直近12ヶ月）">
            <MonthlyChart data={monthly} />
          </SectionCard>
        </>
      )}
    </div>
  );
}
