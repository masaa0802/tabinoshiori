"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_DOCUMENTS } from "@/graphql/queries";
import { DELETE_DOCUMENT } from "@/graphql/mutates";
import LoadingAirplane from "@/components/LoadingAirplane";
import AddDocumentModal from "./AddDocumentModal";
import EditDocumentModal from "./EditDocumentModal";

interface Document {
  id: number;
  itinerary_id: number;
  category: string;
  title: string;
  date: string | null;
  notes: string | null;
  file_url: string | null;
  file_name: string | null;
  created_at: string;
}

interface InfoContentProps {
  itinerary_id: number;
}

const CATEGORY_TABS = [
  { value: "all", label: "すべて" },
  { value: "ticket", label: "チケット" },
  { value: "hotel", label: "ホテル" },
  { value: "flight", label: "フライト" },
];

const CATEGORY_COLORS: Record<string, string> = {
  ticket: "bg-green-100 text-green-700",
  hotel: "bg-purple-100 text-purple-700",
  flight: "bg-blue-100 text-blue-700",
};

const CATEGORY_LABELS: Record<string, string> = {
  ticket: "チケット",
  hotel: "ホテル予約",
  flight: "フライト",
};

const InfoContent: React.FC<InfoContentProps> = ({ itinerary_id }) => {
  const [activeCategory, setActiveCategory] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);

  // スワイプ状態管理
  const [swipedDocId, setSwipedDocId] = useState<number | null>(null);
  const [touchStart, setTouchStart] = useState<number>(0);
  const [touchCurrent, setTouchCurrent] = useState<number>(0);

  const { data, loading, refetch } = useQuery(GET_DOCUMENTS, {
    variables: { itinerary_id },
    skip: !itinerary_id,
  });

  const [deleteDocument] = useMutation(DELETE_DOCUMENT);

  const documents: Document[] = data?.documents ?? [];

  const filtered =
    activeCategory === "all"
      ? documents
      : documents.filter((d) => d.category === activeCategory);

  const handleDelete = async (doc: Document) => {
    const message = doc.file_url
      ? `「${doc.title}」を削除しますか？\n\n添付ファイルもCloudinaryから完全に削除されます。\nこの操作は取り消せません。`
      : `「${doc.title}」を削除しますか？`;
    if (!confirm(message)) return;

    try {
      // Cloudinary削除を先に実行（失敗したらDB削除は行わない）
      if (doc.file_url) {
        const res = await fetch("/api/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file_url: doc.file_url }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "ファイルの削除に失敗しました");
        }
      }

      await deleteDocument({
        variables: { id: doc.id },
        refetchQueries: ["GetDocuments"],
        awaitRefetchQueries: true,
      });
    } catch (error) {
      console.error("Delete error:", error);
      alert("削除に失敗しました");
    }
  };

  // rawリソース（PDF）はCloudinaryがattachment配信するため、
  // 自前のプロキシ経由でinline表示させる
  const toInlineUrl = (url: string) => {
    if (url.includes("/raw/upload/")) {
      return `/api/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
  };

  // スワイプハンドラー
  const handleTouchStart = (e: React.TouchEvent, docId: number) => {
    setTouchStart(e.touches[0].clientX);
    setTouchCurrent(e.touches[0].clientX);
    setSwipedDocId(docId);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === 0) return;
    setTouchCurrent(e.touches[0].clientX);
  };

  const handleTouchEnd = (docId: number) => {
    const diff = touchStart - touchCurrent;
    if (diff > 50) {
      setSwipedDocId(docId);
    } else if (diff < -20) {
      setSwipedDocId(null);
    } else if (swipedDocId !== docId) {
      setSwipedDocId(null);
    }
    setTouchStart(0);
    setTouchCurrent(0);
  };

  const getSwipeOffset = (docId: number) => {
    if (swipedDocId === docId && touchStart !== 0) {
      const diff = touchStart - touchCurrent;
      return Math.min(Math.max(diff, 0), 120);
    }
    return swipedDocId === docId ? 120 : 0;
  };

  if (loading) {
    return <LoadingAirplane fullPage message="読み込み中..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50" onClick={() => setSwipedDocId(null)}>
      <div className="max-w-3xl mx-auto p-4 lg:p-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800">予約情報</h2>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm transition-colors"
          >
            ＋ 追加
          </button>
        </div>

        {/* カテゴリタブ */}
        <div className="flex space-x-2 mb-4 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveCategory(tab.value)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                activeCategory === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ドキュメントリスト */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">予約情報がありません</h3>
            <p className="text-gray-500 mb-6">チケット・ホテル・フライトなどの予約情報を登録しましょう</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              最初の予約情報を追加
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => (
              <div
                key={doc.id}
                className="relative overflow-hidden rounded-xl shadow-sm border border-gray-100"
                onClick={(e) => {
                  if (swipedDocId === doc.id) {
                    e.stopPropagation();
                    setSwipedDocId(null);
                  }
                }}
              >
                {/* スワイプで表示されるアクションボタン（モバイル） */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 md:hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingDocument(doc);
                      setSwipedDocId(null);
                    }}
                    className="w-12 h-12 bg-blue-500 text-white rounded-lg flex items-center justify-center shadow-lg"
                    title="編集"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSwipedDocId(null);
                      handleDelete(doc);
                    }}
                    className="w-12 h-12 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-lg"
                    title="削除"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                {/* スワイプ可能なカードコンテンツ */}
                <div
                  className="bg-white p-4 transition-transform duration-200 ease-out"
                  style={{ transform: `translateX(-${getSwipeOffset(doc.id)}px)` }}
                  onTouchStart={(e) => handleTouchStart(e, doc.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={() => handleTouchEnd(doc.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            CATEGORY_COLORS[doc.category] ?? "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {CATEGORY_LABELS[doc.category] ?? doc.category}
                        </span>
                        {doc.date && (
                          <span className="text-xs text-gray-500">{formatDate(doc.date)}</span>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-800 truncate">{doc.title}</h3>
                      {doc.notes && (
                        <p className="text-sm text-gray-500 mt-1 whitespace-pre-wrap">{doc.notes}</p>
                      )}
                      {doc.file_url && (
                        <a
                          href={toInlineUrl(doc.file_url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mt-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                            />
                          </svg>
                          {doc.file_name ?? "添付ファイルを開く"}
                        </a>
                      )}
                    </div>

                    {/* デスクトップ用アクションボタン */}
                    <div className="hidden md:flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingDocument(doc)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="編集"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(doc)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="削除"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddDocumentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        itinerary_id={itinerary_id}
        documentCount={documents.length}
        onDocumentAdded={() => refetch()}
      />

      <EditDocumentModal
        isOpen={editingDocument !== null}
        onClose={() => setEditingDocument(null)}
        document={editingDocument}
        onDocumentUpdated={() => refetch()}
      />
    </div>
  );
};

export default InfoContent;
