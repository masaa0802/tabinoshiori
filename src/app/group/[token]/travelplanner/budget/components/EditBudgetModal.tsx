import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { UPDATE_BUDGET } from '@/graphql/mutates';
import { GET_ACTIVITIES_BY_DATE } from '@/graphql/queries';
import LoadingAirplane from '@/components/LoadingAirplane';

interface Budget {
  id: number;
  activity_id?: number;
  category: string;
  amount: number;
  description?: string;
  currency: string;
  date: string;
}

interface EditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: Budget;
  itineraryId: number;
  onBudgetUpdated: () => void;
}

const budgetCategories = [
  { label: '交通費', value: 'transport' },
  { label: '宿泊費', value: 'accommodation' },
  { label: '食事', value: 'food' },
  { label: '観光・アクティビティ', value: 'sightseeing' },
  { label: 'お土産', value: 'shopping' },
  { label: 'その他', value: 'other' },
];

// アクティビティタイプの日本語マッピング
const activityTypeLabels: { [key: string]: string } = {
  transport: '交通',
  sightseeing: '観光スポット',
  restaurant: '飲食店',
  hotel: 'ホテル',
  activity: 'アクティビティ',
  area: 'エリア',
};

const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  isOpen,
  onClose,
  budget,
  itineraryId,
  onBudgetUpdated
}) => {
  const [formData, setFormData] = useState({
    activityId: budget.activity_id?.toString() || '',
    category: budget.category,
    amount: budget.amount.toString(),
    description: budget.description || '',
  });

  const { data: activitiesData } = useQuery(GET_ACTIVITIES_BY_DATE, {
    variables: { 
      itinerary_id: itineraryId,
      date: budget.date 
    },
    skip: !budget.date || !itineraryId,
  });

  const [updateBudget, { loading: isSubmitting }] = useMutation(UPDATE_BUDGET);

  useEffect(() => {
    setFormData({
      activityId: budget.activity_id?.toString() || '',
      category: budget.category,
      amount: budget.amount.toString(),
      description: budget.description || '',
    });
  }, [budget]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount) {
      alert('金額は必須です');
      return;
    }

    try {
      await updateBudget({
        variables: {
          id: budget.id,
          activity_id: formData.activityId ? parseInt(formData.activityId) : null,
          category: formData.category,
          amount: parseFloat(formData.amount),
          description: formData.description,
        },
        refetchQueries: ['GetBudgets'],
        awaitRefetchQueries: true,
      });

      onBudgetUpdated();
      onClose();
    } catch (error) {
      console.error('予算の更新に失敗しました:', error);
      alert('予算の更新に失敗しました');
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  const formattedDate = new Date(budget.date + 'T00:00:00').toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: '#0000004d' }}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative">
        <button
          className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
        >
          ×
        </button>
        
        <h2 className="text-xl font-bold text-gray-900 mb-2">予算を編集</h2>
        <p className="text-sm text-gray-600 mb-6">{formattedDate}</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* アクティビティ選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              関連するアクティビティ（任意）
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.activityId}
              onChange={(e) => handleInputChange('activityId', e.target.value)}
            >
              <option value="">アクティビティを選択（任意）</option>
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
            {activitiesData?.activities?.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                この日のアクティビティはありません
              </p>
            )}
          </div>

          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              required
            >
              {budgetCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* 金額 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              金額 <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <input
                type="number"
                step="0.01"
                min="0"
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.amount}
                onChange={(e) => handleInputChange('amount', e.target.value)}
                placeholder="0.00"
                required
              />
              <div className="border border-l-0 border-gray-300 rounded-r-md px-3 py-2 bg-gray-50 text-gray-500">
                {budget.currency}
              </div>
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
              {isSubmitting ? <LoadingAirplane /> : '更新'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditBudgetModal;