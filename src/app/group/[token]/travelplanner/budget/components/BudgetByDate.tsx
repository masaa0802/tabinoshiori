"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_BUDGET } from '@/graphql/mutates';
import EditBudgetModal from './EditBudgetModal';

interface Budget {
  id: number;
  activity_id?: number;
  category: string;
  amount: number;
  description?: string;
  currency: string;
  activity?: {
    id: number;
    name: string;
    type: string;
  };
}

interface BudgetByDateProps {
  date: string;
  budgets: Budget[];
  itineraryId: number;
  onUpdate: () => void;
  onAddBudget?: () => void;
}

const categoryLabels: { [key: string]: string } = {
  transport: '交通',
  sightseeing: '観光スポット',
  restaurant: '飲食店',
  hotel: 'ホテル',
  activity: 'アクティビティ',
  area: 'エリア',
  accommodation: '宿泊',
  food: '食事',
  shopping: 'お土産',
  other: 'その他',
};

const categoryColors: { [key: string]: string } = {
  transport: 'bg-blue-100 text-blue-800',
  sightseeing: 'bg-yellow-100 text-yellow-800',
  restaurant: 'bg-green-100 text-green-800',
  hotel: 'bg-purple-100 text-purple-800',
  activity: 'bg-pink-100 text-pink-800',
  area: 'bg-indigo-100 text-indigo-800',
  accommodation: 'bg-violet-100 text-violet-800',
  food: 'bg-orange-100 text-orange-800',
  shopping: 'bg-rose-100 text-rose-800',
  other: 'bg-gray-100 text-gray-800',
};

const BudgetByDate: React.FC<BudgetByDateProps> = ({
  date,
  budgets,
  itineraryId,
  onUpdate,
}) => {
  const [editingBudget, setEditingBudget] = useState<(Budget & { date: string }) | null>(null);
  const [deleteBudget] = useMutation(DELETE_BUDGET);

  const totalAmount = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('ja-JP', {
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  });

  const categoryTotals = budgets.reduce((acc, budget) => {
    const category = budget.category;
    acc[category] = (acc[category] || 0) + budget.amount;
    return acc;
  }, {} as { [key: string]: number });

  const handleDelete = async (id: number) => {
    if (!confirm('この支出を削除しますか？')) return;
    try {
      await deleteBudget({
        variables: { id },
        refetchQueries: ['GetBudgets'],
        awaitRefetchQueries: true,
      });
      onUpdate();
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">{formattedDate}</h3>
            <p className="text-sm text-gray-600">
              {Object.keys(categoryTotals).length}個のカテゴリ • {budgets.length}件の支出
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              ¥{totalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">合計支出</div>
          </div>
        </div>
      </div>

      {/* カテゴリ別内訳 */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="px-6 pt-4 pb-2">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(categoryTotals).map(([category, amount]) => (
              <div key={category} className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryColors[category] || categoryColors.other}`}>
                  {categoryLabels[category] || category}
                </span>
                <div className="text-right">
                  <div className="font-semibold text-gray-900 text-sm">¥{amount.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{Math.round((amount / totalAmount) * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 個別支出リスト */}
      <div className="px-6 pb-4 pt-3">
        <h4 className="text-sm font-medium text-gray-500 mb-2">支出明細</h4>
        <div className="space-y-2">
          {budgets.map((budget) => (
            <div key={budget.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`flex-shrink-0 px-2 py-1 rounded-full text-xs font-medium ${categoryColors[budget.category] || categoryColors.other}`}>
                  {categoryLabels[budget.category] || budget.category}
                </span>
                <div className="min-w-0">
                  {budget.activity && (
                    <p className="text-sm font-medium text-gray-800 truncate">{budget.activity.name}</p>
                  )}
                  {budget.description && (
                    <p className="text-xs text-gray-500 truncate">{budget.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                <span className="font-semibold text-gray-900">¥{budget.amount.toLocaleString()}</span>
                <button
                  onClick={() => setEditingBudget({ ...budget, date })}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="編集"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(budget.id)}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingBudget && (
        <EditBudgetModal
          isOpen={true}
          onClose={() => setEditingBudget(null)}
          budget={editingBudget}
          itineraryId={itineraryId}
          onBudgetUpdated={() => {
            onUpdate();
            setEditingBudget(null);
          }}
        />
      )}
    </div>
  );
};

export default BudgetByDate;
