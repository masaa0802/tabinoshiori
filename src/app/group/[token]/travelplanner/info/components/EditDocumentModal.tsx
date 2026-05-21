"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "@apollo/client";
import { UPDATE_DOCUMENT } from "@/graphql/mutates";
import LoadingAirplane from "@/components/LoadingAirplane";

interface Document {
  id: number;
  category: string;
  title: string;
  date: string | null;
  notes: string | null;
  file_url: string | null;
  file_name: string | null;
}

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
  onDocumentUpdated: () => void;
}

const CATEGORIES = [
  { value: "ticket", label: "チケット" },
  { value: "hotel", label: "ホテル予約" },
  { value: "flight", label: "フライト" },
];

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onDocumentUpdated,
}) => {
  const [formData, setFormData] = useState({
    category: "ticket",
    title: "",
    date: "",
    notes: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeFile, setRemoveFile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [updateDocument, { loading: isUpdating }] = useMutation(UPDATE_DOCUMENT);

  const isSubmitting = isUploading || isUpdating;

  useEffect(() => {
    if (document) {
      setFormData({
        category: document.category,
        title: document.title,
        date: document.date ?? "",
        notes: document.notes ?? "",
      });
      setSelectedFile(null);
      setRemoveFile(false);
    }
  }, [document]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) setRemoveFile(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document) return;

    if (!formData.title.trim()) {
      alert("タイトルは必須です");
      return;
    }

    let file_url: string | null = document.file_url;
    let file_name: string | null = document.file_name;

    // 既存ファイルを削除する場合
    if (removeFile && document.file_url) {
      try {
        const res = await fetch("/api/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_url: document.file_url }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "ファイルの削除に失敗しました");
        }
      } catch (error) {
        console.error("File delete error:", error);
        alert("ファイルの削除に失敗しました");
        return;
      }
      file_url = null;
      file_name = null;
    }

    // 新しいファイルをアップロードする場合
    if (selectedFile) {
      // 既存ファイルがあれば先に削除
      if (document.file_url && !removeFile) {
        try {
          await fetch("/api/delete", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ file_url: document.file_url }),
          });
        } catch {
          // 削除失敗は無視して続行
        }
      }

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
      await updateDocument({
        variables: {
          id: document.id,
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

      onDocumentUpdated();
      onClose();
    } catch (error) {
      console.error("Update document error:", error);
      alert("更新に失敗しました");
    }
  };

  if (!isOpen || !document) return null;

  const hasExistingFile = document.file_url && !removeFile;

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

        <h2 className="text-xl font-bold text-gray-900 mb-6">予約情報を編集</h2>

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
            {hasExistingFile && (
              <div className="flex items-center justify-between bg-gray-50 rounded-md px-3 py-2 mb-2 border border-gray-200">
                <span className="text-sm text-gray-600 truncate">{document.file_name ?? "添付ファイル"}</span>
                <button
                  type="button"
                  onClick={() => setRemoveFile(true)}
                  className="text-xs text-red-500 hover:text-red-700 ml-2 flex-shrink-0"
                  disabled={isSubmitting}
                >
                  削除
                </button>
              </div>
            )}
            {removeFile && (
              <p className="text-xs text-red-500 mb-2">保存時にファイルが削除されます</p>
            )}
            <input
              type="file"
              accept="image/*,application/pdf"
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              onChange={handleFileChange}
              disabled={isSubmitting}
            />
            {selectedFile && (
              <p className="text-xs text-gray-500 mt-1">{selectedFile.name}（新しいファイルに置き換え）</p>
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
              {isSubmitting ? <LoadingAirplane /> : "保存"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditDocumentModal;
