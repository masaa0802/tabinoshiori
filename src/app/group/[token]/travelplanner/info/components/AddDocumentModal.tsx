"use client";

import React, { useState } from "react";
import { useMutation } from "@apollo/client";
import { INSERT_DOCUMENT } from "@/graphql/mutates";
import LoadingAirplane from "@/components/LoadingAirplane";

const MAX_DOCUMENTS = 20;

interface AddDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  itinerary_id: number;
  documentCount: number;
  onDocumentAdded: () => void;
}

const CATEGORIES = [
  { value: "ticket", label: "チケット" },
  { value: "hotel", label: "ホテル予約" },
  { value: "flight", label: "フライト" },
];

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
  isOpen,
  onClose,
  itinerary_id,
  documentCount,
  onDocumentAdded,
}) => {
  const [formData, setFormData] = useState({
    category: "ticket",
    title: "",
    date: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [insertDocument, { loading: isInserting }] = useMutation(INSERT_DOCUMENT);

  const isSubmitting = isUploading || isInserting;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("タイトルは必須です");
      return;
    }

    let file_url: string | null = null;
    let file_name: string | null = null;

    if (selectedFile) {
      setIsUploading(true);
      try {
        const uploadForm = new FormData();
        uploadForm.append("file", selectedFile);
        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadForm,
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "アップロードに失敗しました");
        }
        const data = await res.json();
        file_url = data.url;
        file_name = data.original_filename;
      } catch (error) {
        console.error("Upload error:", error);
        alert("ファイルのアップロードに失敗しました");
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    try {
      await insertDocument({
        variables: {
          itinerary_id,
          category: formData.category,
          title: formData.title.trim(),
          date: formData.date || null,
          notes: formData.notes.trim() || null,
          file_url,
          file_name,
        },
        refetchQueries: ["GetDocuments"],
        awaitRefetchQueries: true,
      });

      onDocumentAdded();
      onClose();
      setFormData({ category: "ticket", title: "", date: "", notes: "" });
      setSelectedFile(null);
    } catch (error) {
      console.error("Insert document error:", error);
      alert("登録に失敗しました");
    }
  };

  if (!isOpen) return null;

  if (documentCount >= MAX_DOCUMENTS) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
      >
        <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative mx-4">
          <button
            className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 text-2xl"
            onClick={onClose}
          >
            ×
          </button>
          <h2 className="text-xl font-bold text-gray-900 mb-4">登録上限に達しています</h2>
          <p className="text-gray-600 text-sm">
            1つの旅行プランに登録できる予約情報は最大{MAX_DOCUMENTS}件です。
            不要な予約情報を削除してから追加してください。
          </p>
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative mx-4">
        <button
          className="absolute top-2 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
          disabled={isSubmitting}
        >
          ×
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-6">予約情報を追加</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* カテゴリ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリ <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.category}
              onChange={(e) => handleInputChange("category", e.target.value)}
              required
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* タイトル */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              タイトル <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="例：東京タワー入場チケット"
              required
            />
          </div>

          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              日付（任意）
            </label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
            />
          </div>

          {/* メモ */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ（任意）
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder="予約番号、注意事項など..."
            />
          </div>

          {/* ファイル添付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ファイル添付（任意）
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            {selectedFile && (
              <p className="text-xs text-gray-500 mt-1">{selectedFile.name}</p>
            )}
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? <LoadingAirplane /> : "登録"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDocumentModal;
