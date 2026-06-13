"use client";

import { useState, useEffect } from 'react';
import { adminQuery } from '@/lib/admin/graphql-client';

interface DashboardData {
  itineraries_aggregate: { aggregate: { count: number } };
  groups_aggregate: { aggregate: { count: number } };
  activities_aggregate: { aggregate: { count: number } };
  budgets_aggregate: { aggregate: { count: number } };
}

interface Itinerary {
  destination: string | null;
  travel_purpose: string | null;
}

function countOccurrences(items: string[]): Record<string, number> {
  return items.reduce<Record<string, number>>((acc, item) => {
    acc[item] = (acc[item] ?? 0) + 1;
    return acc;
  }, {});
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [destinations, setDestinations] = useState<[string, number][]>([]);
  const [purposes, setPurposes] = useState<[string, number][]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [statsData, itineraryData] = await Promise.all([
          adminQuery<DashboardData>(
            'DashboardStats',
            `query DashboardStats {
              itineraries_aggregate { aggregate { count } }
              groups_aggregate { aggregate { count } }
              activities_aggregate { aggregate { count } }
              budgets_aggregate { aggregate { count } }
            }`
          ),
          adminQuery<{ itineraries: Itinerary[] }>(
            'DestinationStats',
            `query DestinationStats {
              itineraries {
                destination
                travel_purpose
              }
            }`
          ),
        ]);

        if (cancelled) return;

        setStats(statsData);

        const destCounts = countOccurrences(
          itineraryData.itineraries
            .flatMap((i) => (i.destination ?? '').split(',').map((d) => d.trim()))
            .filter(Boolean)
        );
        setDestinations(
          Object.entries(destCounts).sort(([, a], [, b]) => b - a).slice(0, 10)
        );

        const purposeCounts = countOccurrences(
          itineraryData.itineraries
            .flatMap((i) => (i.travel_purpose ?? '').split(',').map((p) => p.trim()))
            .filter(Boolean)
        );
        setPurposes(Object.entries(purposeCounts).sort(([, a], [, b]) => b - a));
      } catch (e) {
        if (!cancelled) setError(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        読み込み中...
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">概要</h2>
        {error ? (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <p className="font-medium">データの取得に失敗しました</p>
            <p className="mt-1 font-mono text-xs">{error}</p>
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="総グループ数" value={stats.groups_aggregate.aggregate.count} />
            <StatCard label="総旅程数" value={stats.itineraries_aggregate.aggregate.count} />
            <StatCard label="総アクティビティ数" value={stats.activities_aggregate.aggregate.count} />
            <StatCard label="総予算入力数" value={stats.budgets_aggregate.aggregate.count} />
          </div>
        ) : null}
      </div>

      {!error && (
        <div className="grid md:grid-cols-2 gap-8">
          {/* 人気目的地 */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">人気の目的地 Top 10</h3>
            {destinations.length > 0 ? (
              <ol className="space-y-2">
                {destinations.map(([dest, count], i) => (
                  <li key={dest} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      <span className="text-gray-700">{dest}</span>
                    </span>
                    <span className="text-gray-500 font-medium">{count} 件</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-400 text-sm">データなし</p>
            )}
          </div>

          {/* 旅の目的 */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">旅の目的</h3>
            {purposes.length > 0 ? (
              <ul className="space-y-2">
                {purposes.map(([purpose, count]) => (
                  <li key={purpose} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{purpose}</span>
                    <span className="text-gray-500 font-medium">{count} 件</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 text-sm">データなし</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
