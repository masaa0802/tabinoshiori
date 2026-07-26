"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_ITINERARY_DATES_WITH_CLEANUP } from "@/graphql/mutates";

interface Activity {
  id: number;
  date: string;
  name: string;
}

interface EditItineraryDatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryId: number;
  currentStartDate: string;
  currentEndDate: string;
  activities: Activity[];
  onSuccess: (newStartDate: string, newEndDate: string) => void;
}

const EditItineraryDatesModal: React.FC<EditItineraryDatesModalProps> = ({
  isOpen,
  onClose,
  itineraryId,
  currentStartDate,
  currentEndDate,
  activities,
  onSuccess,
}) => {
  const [startDate, setStartDate] = useState(currentStartDate);
  const [endDate, setEndDate] = useState(currentEndDate);
  const [saving, setSaving] = useState(false);

  const [updateItineraryDatesWithCleanup] = useMutation(UPDATE_ITINERARY_DATES_WITH_CLEANUP);

  useEffect(() => {
    if (isOpen) {
      setStartDate(currentStartDate);
      setEndDate(currentEndDate);
    }
  }, [isOpen, currentStartDate, currentEndDate]);

  const isChanged = startDate !== currentStartDate || endDate !== currentEndDate;

  // 期間外になるアクティビティを算出
  const affectedActivities = activities.filter((a) => {
    if (!a.date) return false;
    return a.date < startDate || a.date > endDate;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      alert("出発日と帰着日を入力してください");
      return;
    }
    if (startDate > endDate) {
      alert("帰着日は出発日と同じか、それより後の日付を選択してください");
      return;
    }
    if (!isChanged) {
      onClose();
      return;
    }

    const confirmMessage =
      affectedActivities.length > 0
        ? `${affectedActivities.length}件のアクティビティと期間外の予算データが削除されます。\n続けますか？`
        : `期間外の予算データがある場合は削除されます。\n続けますか？`;

    if (!window.confirm(confirmMessage)) return;

    setSaving(true);
    try {
      // 日程更新・期間外アクティビティ削除・期間外予算削除を1トランザクションで実行
      await updateItineraryDatesWithCleanup({
        variables: {
          id: itineraryId,
          start_date: startDate,
          end_date: endDate,
        },
      });

      onSuccess(startDate, endDate);
    } catch (error) {
      console.error("日程の更新に失敗しました:", error);
      alert(`日程の更新に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-base font-bold text-white">旅行期間を変更</h2>
          </div>
          <button
            className="text-white/80 hover:text-white text-xl transition-colors p-1"
            onClick={onClose}
            disabled={saving}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 出発日 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">出発日</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 帰着日 */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">帰着日</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 期間外アクティビティの警告（アクティビティがある場合） */}
          {isChanged && affectedActivities.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1.5">
              <div className="flex gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-xs text-red-700 font-semibold">
                  以下の{affectedActivities.length}件のアクティビティが削除されます
                </p>
              </div>
              <ul className="pl-6 space-y-0.5">
                {affectedActivities.map((a) => (
                  <li key={a.id} className="text-xs text-red-600">
                    ・{a.name}（{a.date}）
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 予算削除の警告（日程変更時は常に表示） */}
          {isChanged && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-amber-700">
                新しい期間外の日付に登録された<span className="font-semibold">予算データも削除</span>されます。
              </p>
            </div>
          )}

          {/* ボタン */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold hover:from-blue-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-sm shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              {saving ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  保存中...
                </>
              ) : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItineraryDatesModal;
