import { adminQueryServer as adminQuery } from '@/lib/admin/graphql-client';

// ページは毎回サーバーサイドでデータ取得（キャッシュなし）
export const dynamic = 'force-dynamic';

interface DashboardData {
  itineraries_aggregate: { aggregate: { count: number } };
  groups_aggregate: { aggregate: { count: number } };
  activities_aggregate: { aggregate: { count: number } };
  budgets_aggregate: { aggregate: { count: number } };
}

interface DestinationData {
  itineraries: { destination: string | null }[];
}

interface PurposeData {
  itineraries: { travel_purpose: string | null }[];
}

async function getDashboardStats(): Promise<DashboardData | null> {
  try {
    return await adminQuery<DashboardData>(
      'DashboardStats',
      `query DashboardStats {
        itineraries_aggregate { aggregate { count } }
        groups_aggregate { aggregate { count } }
        activities_aggregate { aggregate { count } }
        budgets_aggregate { aggregate { count } }
      }`
    );
  } catch {
    return null;
  }
}

async function getDestinationStats(): Promise<DestinationData | null> {
  try {
    return await adminQuery<DestinationData>(
      'DestinationStats',
      `query DestinationStats {
        itineraries(where: { destination: { _is_null: false } }) {
          destination
        }
      }`
    );
  } catch {
    return null;
  }
}

async function getPurposeStats(): Promise<PurposeData | null> {
  try {
    return await adminQuery<PurposeData>(
      'PurposeStats',
      `query PurposeStats {
        itineraries(where: { travel_purpose: { _is_null: false, _neq: "" } }) {
          travel_purpose
        }
      }`
    );
  } catch {
    return null;
  }
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

export default async function AdminDashboardPage() {
  const [stats, destinations, purposes] = await Promise.all([
    getDashboardStats(),
    getDestinationStats(),
    getPurposeStats(),
  ]);

  // 目的地の集計（コンマ区切りを展開）
  const destinationCounts = destinations
    ? countOccurrences(
        destinations.itineraries
          .flatMap((i) => (i.destination ?? '').split(',').map((d) => d.trim()))
          .filter(Boolean)
      )
    : {};
  const topDestinations = Object.entries(destinationCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // 旅の目的の集計（コンマ区切りを展開）
  const purposeCounts = purposes
    ? countOccurrences(
        purposes.itineraries
          .flatMap((i) => (i.travel_purpose ?? '').split(',').map((p) => p.trim()))
          .filter(Boolean)
      )
    : {};
  const topPurposes = Object.entries(purposeCounts).sort(([, a], [, b]) => b - a);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h2 className="text-xl font-bold text-gray-800 mb-4">概要</h2>
        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="総グループ数" value={stats.groups_aggregate.aggregate.count} />
            <StatCard label="総旅程数" value={stats.itineraries_aggregate.aggregate.count} />
            <StatCard label="総アクティビティ数" value={stats.activities_aggregate.aggregate.count} />
            <StatCard label="総予算入力数" value={stats.budgets_aggregate.aggregate.count} />
          </div>
        ) : (
          <p className="text-gray-500 text-sm">データの取得に失敗しました</p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* 人気目的地 */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="font-bold text-gray-800 mb-4">人気の目的地 Top 10</h3>
          {topDestinations.length > 0 ? (
            <ol className="space-y-2">
              {topDestinations.map(([dest, count], i) => (
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
          {topPurposes.length > 0 ? (
            <ul className="space-y-2">
              {topPurposes.map(([purpose, count]) => (
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
    </div>
  );
}
