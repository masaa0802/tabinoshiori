"use client";

import React, { useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_ACTIVITIES } from '@/graphql/queries';
import { dayNumberOf, formatDocumentDate } from '../documentUtils';

export interface ActivityOption {
  id: number;
  name: string;
  date: string;
  time?: string | null;
}

interface ActivitySelectProps {
  id: string;
  itineraryId: number;
  /** 選んでいるアクティビティの id。紐づけない時は null */
  value: number | null;
  onChange: (activity: ActivityOption | null) => void;
  startDate?: string;
  endDate?: string;
}

/**
 * 情報をどの予定（アクティビティ）に紐づけるかを選ぶ。
 * 旅程のアクティビティを日付ごとにまとめて並べる。旅程画面と同じクエリなので、多くはキャッシュから出る
 */
const ActivitySelect: React.FC<ActivitySelectProps> = ({ id, itineraryId, value, onChange, startDate, endDate }) => {
  const { data, loading } = useQuery(GET_ACTIVITIES, {
    variables: { itinerary_id: itineraryId },
    fetchPolicy: 'cache-first',
  });

  const activities: ActivityOption[] = useMemo(() => data?.activities ?? [], [data]);

  const groups = useMemo(() => {
    const byDate = new Map<string, ActivityOption[]>();
    for (const activity of activities) {
      if (!byDate.has(activity.date)) byDate.set(activity.date, []);
      byDate.get(activity.date)!.push(activity);
    }
    return Array.from(byDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, items]) => {
        const dayNumber = dayNumberOf(date, startDate, endDate);
        return {
          date,
          label: `${dayNumber !== undefined ? `${dayNumber}日目 - ` : ''}${formatDocumentDate(date)}`,
          items: items.slice().sort((a, b) => (a.time ?? '').localeCompare(b.time ?? '')),
        };
      });
  }, [activities, startDate, endDate]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value ? Number(e.target.value) : null;
    onChange(activities.find((a) => a.id === selectedId) ?? null);
  };

  return (
    <select
      id={id}
      value={value ?? ''}
      onChange={handleChange}
      disabled={loading && activities.length === 0}
      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:border-transparent"
    >
      <option value="">紐づけない</option>
      {/* 読み込み前でも、選んでいる値は消さない */}
      {value !== null && !activities.some((a) => a.id === value) && <option value={value}>（読み込み中）</option>}
      {groups.map((group) => (
        <optgroup key={group.date} label={group.label}>
          {group.items.map((activity) => (
            <option key={activity.id} value={activity.id}>
              {activity.time ? `${activity.time.substring(0, 5)} ` : ''}{activity.name}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
};

export default ActivitySelect;
