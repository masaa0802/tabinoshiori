"use client";

import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { INSERT_TRAVEL_DOCUMENT } from '@/graphql/mutates';
import { CATEGORIES, CategoryIcon } from './InformationContent';
import { uploadToCloudinary, validateFile } from '@/lib/cloudinary';

const MAX_FILES = 5;

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itineraryId: number;
  onDocumentAdded: () => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  itineraryId,
  onDocumentAdded,
}) => {
  const [category, setCategory] = useState(CATEGORIES[0].value);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [insertDocument] = useMutation(INSERT_TRAVEL_DOCUMENT);

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles = Array.from(fileList);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      if (files.length + validFiles.length >= MAX_FILES) {
        alert(`ファイルは最大${MAX_FILES}個まで追加できます`);
        break;
      }
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        continue;
      }
      validFiles.push(file);
    }

    setFiles(prev => [...prev, ...validFiles]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) {
      alert('少なくとも1つのファイルをアップロードしてください');
      return;
    }

    setUploading(true);

    try {
      // ファイルをCloudinaryにアップロード
      let uploadedFiles;
      try {
        uploadedFiles = await Promise.all(
          files.map((file, index) =>
            uploadToCloudinary(file, `travel-planner/${itineraryId}/documents`).then(result => ({
              ...result,
              display_order: index,
            }))
          )
        );
      } catch (uploadError) {
        console.error('ファイルアップロードに失敗しました:', uploadError);
        alert(`ファイルのアップロードに失敗しました: ${uploadError instanceof Error ? uploadError.message : String(uploadError)}`);
        return;
      }

      // ドキュメントをデータベースに保存
      await insertDocument({
        variables: {
          itinerary_id: itineraryId,
          title: files[0]?.name.replace(/\.[^/.]+$/, '') || category,
          category,
          date: null,
          reservation_number: null,
          notes: null,
          files: uploadedFiles.map(file => ({
            file_url: file.file_url,
            file_type: file.file_type,
            file_name: file.file_name,
            file_size: file.file_size,
            mime_type: file.mime_type,
            cloudinary_public_id: file.cloudinary_public_id,
            display_order: file.display_order,
          })),
        },
      });

      onDocumentAdded();
      resetForm();
    } catch (error) {
      console.error('ドキュメントの追加に失敗しました:', error);
      const message = error instanceof Error ? error.message : String(error);
      alert(`ドキュメントの追加に失敗しました: ${message}`);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setCategory(CATEGORIES[0].value);
    setFiles([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-hidden relative">
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 px-3 sm:px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-white">情報を追加</h2>
          </div>
          <button
            className="text-white/80 hover:text-white text-xl transition-colors p-1"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="p-3 sm:p-5 overflow-y-auto max-h-[calc(85vh-52px)]">

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* ファイルアップロード */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              ファイル * <span className="text-gray-400 font-normal">({files.length}/{MAX_FILES})</span>
            </label>
            {files.length < MAX_FILES && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors ${
                  isDragging ? 'border-sky-400 bg-sky-100' : 'border-sky-200 bg-sky-50/50 hover:bg-sky-50'
                }`}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer block"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-sky-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-700 font-medium mb-0.5">
                    ドラッグ&ドロップ、またはタップして選択
                  </p>
                  <p className="text-[10px] text-gray-500">
                    PDF, JPG, PNG (最大10MB・{MAX_FILES}個まで)
                  </p>
                </label>
              </div>
            )}

            {/* 選択されたファイル一覧 */}
            {files.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between bg-white border border-gray-100 px-2.5 py-1.5 rounded-lg">
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      {file.type === 'application/pdf' ? (
                        <svg className="w-3.5 h-3.5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>
                        </svg>
                      ) : (
                        <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                          <circle cx="8.5" cy="8.5" r="1.5"/>
                          <polyline points="21,15 16,10 5,21"/>
                        </svg>
                      )}
                      <span className="text-xs text-gray-700 truncate">{file.name}</span>
                      <span className="text-[10px] text-gray-500 hidden sm:inline flex-shrink-0">
                        ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-gray-400 hover:text-red-500 ml-1.5 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* カテゴリー */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">カテゴリー *</label>
            <div className="grid grid-cols-4 gap-1.5">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-lg border-2 transition-all ${
                    category === cat.value
                      ? 'border-current shadow-sm'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    borderColor: category === cat.value ? cat.color : undefined,
                    backgroundColor: category === cat.value ? `${cat.color}10` : undefined,
                  }}
                >
                  <span style={{ color: cat.color }}>
                    <CategoryIcon category={cat.value} className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <span className={`text-[10px] sm:text-xs mt-0.5 ${category === cat.value ? 'font-medium' : 'text-gray-600'}`}>
                    {cat.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              className="px-3 sm:px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-medium transition-colors"
              onClick={onClose}
              disabled={uploading}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-3 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold hover:from-sky-600 hover:to-blue-700 disabled:from-gray-400 disabled:to-gray-400 text-sm shadow-sm transition-all flex items-center gap-1.5"
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  アップロード中...
                </>
              ) : '保存'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default AddDocumentModal;
