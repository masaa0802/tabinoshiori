"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@apollo/client';
import { GET_TRAVEL_DOCUMENTS } from '@/graphql/queries';
import DocumentCard from './DocumentCard';
import AddDocumentModal from './AddDocumentModal';

interface InformationContentProps {
  itinerary_id?: number;
  startDate?: string;
  endDate?: string;
}

// カテゴリーアイコンコンポーネント
export const CategoryIcon: React.FC<{ category: string; className?: string }> = ({ category, className = "w-5 h-5" }) => {
  const icons: { [key: string]: React.ReactNode } = {
    flight: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
      </svg>
    ),
    hotel: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14M3 21h18M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"/>
        <rect x="7" y="8" width="3" height="3" rx="0.5"/>
        <rect x="14" y="8" width="3" height="3" rx="0.5"/>
      </svg>
    ),
    car: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 17a2 2 0 104 0M15 17a2 2 0 104 0"/>
        <path d="M3 17h2m14 0h2v-5a1 1 0 00-1-1h-1l-1.67-4.17A2 2 0 0015.49 5H8.51a2 2 0 00-1.84 1.83L5 11H4a1 1 0 00-1 1v5"/>
        <path d="M5 11h14"/>
      </svg>
    ),
    transport: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 15V9a2 2 0 012-2h12a2 2 0 012 2v6"/>
        <path d="M4 15h16"/>
        <circle cx="7" cy="18" r="2"/>
        <circle cx="17" cy="18" r="2"/>
        <path d="M9 18h6"/>
      </svg>
    ),
    insurance: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    emergency: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
      </svg>
    ),
    ticket: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v6a3 3 0 01-3 3H5a3 3 0 01-3-3V9z"/>
        <path d="M9 6v12"/>
        <path d="M13 9h4"/>
        <path d="M13 12h4"/>
      </svg>
    ),
    other: (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10,9 9,9 8,9"/>
      </svg>
    ),
  };
  return icons[category] || icons.other;
};

// カテゴリー定義
export const CATEGORIES = [
  { value: 'flight', label: '航空券', color: '#0EA5E9' },
  { value: 'hotel', label: 'ホテル', color: '#8B5CF6' },
  { value: 'car', label: 'レンタカー', color: '#10B981' },
  { value: 'transport', label: '交通機関', color: '#F59E0B' },
  { value: 'insurance', label: '保険', color: '#EF4444' },
  { value: 'emergency', label: '緊急連絡先', color: '#DC2626' },
  { value: 'ticket', label: 'チケット', color: '#EC4899' },
  { value: 'other', label: 'その他', color: '#6B7280' },
];

const InformationContent: React.FC<InformationContentProps> = ({ itinerary_id, startDate, endDate }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const { data, loading, error, refetch } = useQuery(GET_TRAVEL_DOCUMENTS, {
    variables: { itinerary_id },
    skip: !itinerary_id,
  });

  const documents = useMemo(() => {
    if (!data?.travel_documents) return [];

    if (selectedCategory === 'all') {
      return data.travel_documents;
    }

    return data.travel_documents.filter((doc: any) => doc.category === selectedCategory);
  }, [data, selectedCategory]);

  const handleDocumentAdded = () => {
    refetch();
    setIsAddModalOpen(false);
  };

  const handleDocumentUpdated = () => {
    refetch();
  };

  if (!itinerary_id) {
    return (
      <div className="p-6 text-center">
        <p className="text-gray-600">旅行プランが選択されていません。</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">エラーが発生しました: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-b from-gray-50 to-white overflow-x-hidden">
      <div className="w-full max-w-full px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-6 overflow-x-hidden">
        {/* ヘッダー */}
        <div className="mb-4">
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-900">旅行情報</h2>
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 mt-0.5 truncate">航空券・ホテル・チケットなどをまとめて管理</p>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-sky-100 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ml-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
            </div>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="w-full bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-3 sm:px-4 py-2.5 rounded-lg sm:rounded-xl font-medium shadow-sm transition-all text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              情報を追加
            </button>
          </div>
        </div>

        {/* カテゴリーフィルター */}
        <div className="mb-4 overflow-hidden">
          <div className="flex overflow-x-auto gap-1.5 sm:gap-2 pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`flex-shrink-0 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap transition-all text-[11px] sm:text-xs md:text-sm font-medium border ${
                selectedCategory === 'all'
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              すべて
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => setSelectedCategory(category.value)}
                className={`flex-shrink-0 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full whitespace-nowrap transition-all flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-xs md:text-sm font-medium border ${
                  selectedCategory === category.value
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedCategory === category.value ? category.color : undefined,
                  borderColor: selectedCategory === category.value ? category.color : undefined,
                }}
              >
                <span style={{ color: selectedCategory === category.value ? 'white' : category.color }}>
                  <CategoryIcon category={category.value} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ドキュメント一覧 */}
        {documents.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8 md:p-12 text-center mx-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-sm sm:text-base md:text-lg font-medium text-gray-900 mb-1.5 sm:mb-2">
              {selectedCategory === 'all' ? '情報がありません' : `${CATEGORIES.find(c => c.value === selectedCategory)?.label}の情報がありません`}
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-gray-500 mb-4">
              航空券やホテルの予約情報などを追加してください
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors text-sm"
            >
              最初の情報を追加
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
            {documents.map((document: any) => (
              <DocumentCard
                key={document.id}
                document={document}
                onUpdate={handleDocumentUpdated}
              />
            ))}
          </div>
        )}
      </div>

      {/* 追加モーダル */}
      {isAddModalOpen && (
        <AddDocumentModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          itineraryId={itinerary_id}
          onDocumentAdded={handleDocumentAdded}
          startDate={startDate || ''}
          endDate={endDate || ''}
        />
      )}
    </div>
  );
};

export default InformationContent;
