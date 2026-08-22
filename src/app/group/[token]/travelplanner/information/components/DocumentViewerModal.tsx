"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { DELETE_TRAVEL_DOCUMENT } from '@/graphql/mutates';
import { CATEGORIES, CategoryIcon } from './InformationContent';

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

interface DocumentViewerModalProps {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  document: travelDocument,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [deleteDocument] = useMutation(DELETE_TRAVEL_DOCUMENT);

  if (!isOpen) return null;

  const category = CATEGORIES.find(c => c.value === travelDocument.category);
  const currentFile = travelDocument.files[currentFileIndex];

  const handlePrevious = () => {
    setCurrentFileIndex((prev) => (prev > 0 ? prev - 1 : travelDocument.files.length - 1));
  };

  const handleNext = () => {
    setCurrentFileIndex((prev) => (prev < travelDocument.files.length - 1 ? prev + 1 : 0));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentFile.file_url;
    link.download = currentFile.file_name;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = async () => {
    if (!confirm('この情報を削除しますか？')) return;

    try {
      await deleteDocument({ variables: { id: travelDocument.id } });
      onDeleted();
      onClose();
    } catch (error) {
      console.error('削除に失敗しました:', error);
      alert('削除に失敗しました');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <div
        className="h-full flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="bg-white border-b border-gray-100 p-3 sm:p-4 flex items-center justify-between safe-area-top">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: `${category?.color}15` }}
            >
              <span style={{ color: category?.color }}>
                <CategoryIcon category={travelDocument.category} className="w-4 h-4 sm:w-5 sm:h-5" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 truncate text-sm sm:text-base">{travelDocument.title}</h2>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs px-2 py-0.5 rounded-full text-white font-medium"
                  style={{ backgroundColor: category?.color }}
                >
                  {category?.label}
                </span>
                <span className="text-xs text-gray-500">
                  {currentFileIndex + 1} / {travelDocument.files.length}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors ml-2 sm:ml-4 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ビューアー */}
        <div className="flex-1 bg-gray-900 flex items-center justify-center relative overflow-hidden">
          {currentFile.file_type === 'pdf' ? (
            /* PDFビューアー */
            <iframe
              src={`${currentFile.file_url}#toolbar=1`}
              className="w-full h-full bg-white"
              title={currentFile.file_name}
            />
          ) : (
            /* 画像ビューアー */
            <img
              src={currentFile.file_url}
              alt={currentFile.file_name}
              className="max-w-full max-h-full object-contain"
            />
          )}

          {/* ナビゲーション（複数ファイルの場合のみ） */}
          {travelDocument.files.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-2.5 sm:p-3 shadow-lg transition-all hover:scale-105"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white rounded-full p-2.5 sm:p-3 shadow-lg transition-all hover:scale-105"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* フッター（アクション） */}
        <div className="bg-white border-t border-gray-100 p-3 sm:p-4 space-y-3 safe-area-bottom">
          {/* インディケーター（複数ファイルの場合） */}
          {travelDocument.files.length > 1 && (
            <div className="flex justify-center gap-2">
              {travelDocument.files.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentFileIndex(index)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    index === currentFileIndex
                      ? 'bg-sky-500 scale-110'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white px-4 py-2.5 sm:py-3 rounded-xl font-medium flex items-center justify-center gap-2 text-sm sm:text-base shadow-sm transition-all"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              ダウンロード
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 sm:py-3 rounded-xl font-medium flex items-center justify-center bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"
              title="削除"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
