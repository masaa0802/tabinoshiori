import React, { useState, useEffect, useMemo } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { INSERT_BUDGET } from '@/graphql/mutates';
import { GET_ACTIVITIES_BY_DATE, GET_ITINERARIES } from '@/graphql/queries';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryId: number;
  onBudgetAdded: () => void;
  defaultDate?: string;
  participants?: string[];
  itinerary?: {
    start_date: string;
    end_date: string;
  };
}

// アクティビティタイプの日本語マッピング
const activityTypeLabels: { [key: string]: string } = {
  transport: '交通',
  sightseeing: '観光スポット',
  restaurant: '飲食店',
  hotel: 'ホテル',
  activity: 'アクティビティ',
  area: 'エリア',
};

const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  isOpen,
  onClose,
  itineraryId,
  onBudgetAdded,
  defaultDate = '',
  participants = [],
  itinerary
}) => {
  const [formData, setFormData] = useState({
    date: defaultDate || '',
    activityId: '',
    amount: '',
    description: '',
    currency: 'JPY',
    paidBy: participants[0] || '' // デフォルトで最初の参加者を選択
  });

  // 旅行プラン情報を取得（propsで渡されていない場合のフォールバック）
  const { data: itinerariesData } = useQuery(GET_ITINERARIES, {
    skip: Boolean(itinerary) // itineraryが渡されている場合はクエリをスキップ
  });
  const currentItinerary = itinerary || itinerariesData?.itineraries?.[0];

  // 旅行の日程計算（useMemoでメモ化）
  const startDate = useMemo(() =>
    currentItinerary ? new Date(currentItinerary.start_date) : null,
    [currentItinerary]
  );
  const endDate = useMemo(() =>
    currentItinerary ? new Date(currentItinerary.end_date) : null,
    [currentItinerary]
  );
  const totalDays = useMemo(() =>
    startDate && endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1 : 0,
    [startDate, endDate]
  );

  // 旅行期間の日付リストを生成（AddActivityModalと同じロジック）
  const generateDateOptions = () => {
    if (!currentItinerary) return [];

    const dates: { value: string; label: string; dayNumber: number }[] = [];
    const start = new Date(currentItinerary.start_date);
    const end = new Date(currentItinerary.end_date);

    const currentDate = new Date(start);
    let dayNumber = 1;

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const formattedDate = new Intl.DateTimeFormat('ja-JP', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      }).format(currentDate);

      dates.push({
        value: dateStr,
        label: `${dayNumber}日目 - ${formattedDate}`,
        dayNumber: dayNumber
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayNumber++;
    }

    return dates;
  };

  const dateOptions = generateDateOptions();

  // 選択された日付
  const selectedDate = formData.date;

  const { data: activitiesData } = useQuery(GET_ACTIVITIES_BY_DATE, {
    variables: {
      itinerary_id: itineraryId,
      date: selectedDate
    },
    skip: !selectedDate || !itineraryId,
  });

  const [insertBudget, { loading: isSubmitting }] = useMutation(INSERT_BUDGET);

  // defaultDateが変更されたら日付を更新
  useEffect(() => {
    if (defaultDate) {
      setFormData(prev => ({ ...prev, date: defaultDate }));
    }
  }, [defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.activityId || !formData.amount) {
      alert('アクティビティと金額は必須です');
      return;
    }

    // 選択されたアクティビティのタイプを取得
    const selectedActivity = activitiesData?.activities?.find(
      (activity: { id: number; type: string }) => activity.id === parseInt(formData.activityId)
    );
    const activityType = selectedActivity?.type || 'other';

    try {
      await insertBudget({
        variables: {
          itinerary_id: itineraryId,
          date: selectedDate,
          activity_id: parseInt(formData.activityId),
          category: activityType, // アクティビティのタイプを使用
          amount: parseFloat(formData.amount),
          description: formData.description,
          currency: formData.currency,
          paid_by: formData.paidBy,
        },
        refetchQueries: ['GetBudgets'],
        awaitRefetchQueries: true,
      });

      onBudgetAdded();
      onClose();
      setFormData({
        date: defaultDate || '',
        activityId: '',
        amount: '',
        description: '',
        currency: 'JPY',
        paidBy: participants[0] || ''
      });
    } catch (error) {
      console.error('支出の追加に失敗しました:', error);
      alert('支出の追加に失敗しました');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-6">支出を追加</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 日程選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日程 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.date}
              onChange={(e) => handleInputChange('date', e.target.value)}
              required
            >
              <option value="">日付を選択してください</option>
              {dateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* アクティビティ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              関連するアクティビティ <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.activityId}
              onChange={(e) => handleInputChange('activityId', e.target.value)}
              required
            >
              <option value="">アクティビティを選択してください</option>
              {activitiesData?.activities?.map((activity: { id: number; name: string; type: string }) => {
                const typeLabel = activity.type 
                  ? (activityTypeLabels[activity.type] || activity.type)
                  : '未分類';
                return (
                  <option key={activity.id} value={activity.id}>
                    {activity.name} ({typeLabel})
                  </option>
                );
              })}
            </select>
            {selectedDate && activitiesData?.activities?.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                この日のアクティビティはありません
              </p>
            )}
          </div>

          {/* 建て替え者 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              建て替えた人 <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.paidBy}
              onChange={(e) => handleInputChange('paidBy', e.target.value)}
              required
            >
              {participants.length > 0 ? (
                participants.map((participant) => (
                  <option key={participant} value={participant}>
                    {participant}
                  </option>
                ))
              ) : (
                <option value="">参加者データがありません</option>
              )}
            </select>
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金額 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">¥</span>
              <input
                type="number"
                step="1"
                min="0"
                className="w-full border border-gray-300 rounded-md pl-8 pr-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* 説明 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明（任意）
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="支出の詳細..."
            />
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? '追加中...' : '支出を追加'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBudgetModal;