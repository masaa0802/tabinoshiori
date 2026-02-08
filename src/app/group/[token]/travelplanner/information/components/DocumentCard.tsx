"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_TRAVEL_DOCUMENT } from '@/graphql/mutates';
import { CATEGORIES, CategoryIcon } from './InformationContent';
import DocumentViewerModal from './DocumentViewerModal';
import { formatFileSize } from '@/lib/cloudinary';

interface DocumentFile {
  id: number;
  file_url: string;
  file_type: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
}

interface Document {
  id: number;
  title: string;
  category: string;
  date?: string;
  reservation_number?: string;
  notes?: string;
  files: DocumentFile[];
}

interface DocumentCardProps {
  document: Document;
  onUpdate: () => void;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ document, onUpdate }) => {
  const [swipedId, setSwipedId] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchCurrent, setTouchCurrent] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const [deleteDocument] = useMutation(DELETE_TRAVEL_DOCUMENT);

  const category = CATEGORIES.find(c => c.value === document.category);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
    setTouchCurrent(e.touches[0].clientX);
    setSwipedId(document.id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === 0) return;
    setTouchCurrent(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    const diff = touchStart - touchCurrent;

    if (diff > 50) {
      // 50px以上左にスワイプした場合、ボタンを表示
      setSwipedId(document.id);
    } else {
      setSwipedId(null);
    }

    setTouchStart(0);
    setTouchCurrent(0);
  };

  const getSwipeOffset = () => {
    const maxOffset = 52; // Reduced for mobile
    if (swipedId === document.id && touchStart !== 0) {
      const diff = touchStart - touchCurrent;
      return Math.min(Math.max(diff, 0), maxOffset);
    }
    return swipedId === document.id ? maxOffset : 0;
  };

  const handleDelete = async () => {
    if (!confirm('この情報を削除しますか？')) return;

    try {
      await deleteDocument({
        variables: { id: document.id },
      });
      onUpdate();
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <>
      <div className="relative overflow-hidden">
        {/* アクションボタン（スワイプで表示） */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-1">
          <button
            onClick={handleDelete}
            className="w-9 h-9 sm:w-10 sm:h-10 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>

        {/* スワイプ可能なカード */}
        <div
          className="bg-white rounded-xl sm:rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
          style={{
            transform: `translateX(-${getSwipeOffset()}px)`,
            transitionDuration: touchStart !== 0 ? '0ms' : '200ms',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsViewerOpen(true)}
        >
          {/* カテゴリーカラーのアクセントライン */}
          <div className="h-0.5 sm:h-1" style={{ backgroundColor: category?.color }} />
          <div className="p-2.5 sm:p-3 md:p-4">
            {/* カテゴリーとタイトル */}
            <div className="flex items-start gap-2 sm:gap-3 mb-2">
              <div
                className="w-9 h-9 sm:w-10 sm:h-10 md:w-11 md:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${category?.color}15` }}
              >
                <span style={{ color: category?.color }}>
                  <CategoryIcon category={document.category} className="w-4 h-4 sm:w-5 sm:h-5" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 mb-0.5 sm:mb-1 text-xs sm:text-sm md:text-base line-clamp-1">{document.title}</h3>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded text-white font-medium"
                    style={{ backgroundColor: category?.color }}
                  >
                    {category?.label}
                  </span>
                </div>
              </div>
            </div>

            {/* 日時 */}
            {document.date && (
              <div className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="truncate">{formatDate(document.date)}</span>
              </div>
            )}

            {/* 予約番号 */}
            {document.reservation_number && (
              <div className="text-[10px] sm:text-xs text-gray-600 mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5">
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                <span className="truncate">予約番号: {document.reservation_number}</span>
              </div>
            )}

            {/* メモ */}
            {document.notes && (
              <p className="text-[10px] sm:text-xs text-gray-700 mb-1.5 sm:mb-2 line-clamp-2">{document.notes}</p>
            )}

            {/* ファイル情報 */}
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {document.files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs border border-gray-100"
                >
                  {file.file_type === 'pdf' ? (
                    <svg className="w-3 h-3 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zm-2.5 9.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm4 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                    </svg>
                  ) : (
                    <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21,15 16,10 5,21"/>
                    </svg>
                  )}
                  <span className="text-gray-700 truncate max-w-[60px] sm:max-w-[100px]">
                    {file.file_name}
                  </span>
                  {file.file_size && (
                    <span className="text-gray-500 hidden sm:inline">
                      ({formatFileSize(file.file_size)})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ビューアーモーダル */}
      {isViewerOpen && (
        <DocumentViewerModal
          document={document}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </>
  );
};

export default DocumentCard;
