"use client";

import { useMutation } from '@apollo/client';
import { INSERT_TRAVEL_DOCUMENT } from '@/graphql/mutates';
import { uploadToCloudinary } from '@/lib/cloudinary';
import { parseLocalDate } from '@/lib/openingHours';

export const MAX_DOCUMENT_FILES = 5;

/** ローカル日付を "YYYY-MM-DD" にする（toISOString は UTC なので日本時間の朝に前日になる） */
export const toDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const todayString = () => toDateString(new Date());

/** 旅行中なら今日の日付、そうでなければ undefined */
export const todayInTrip = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return undefined;
  const today = todayString();
  return today >= startDate.slice(0, 10) && today <= endDate.slice(0, 10) ? today : undefined;
};

/** 旅行初日から数えて何日目か。期間外なら undefined */
export const dayNumberOf = (date: string, startDate?: string, endDate?: string) => {
  if (!startDate) return undefined;
  const diff = Math.round((parseLocalDate(date).getTime() - parseLocalDate(startDate.slice(0, 10)).getTime()) / 86_400_000) + 1;
  if (diff < 1) return undefined;
  if (endDate && date > endDate.slice(0, 10)) return undefined;
  return diff;
};

export const formatDocumentDate = (date: string) =>
  parseLocalDate(date).toLocaleDateString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short' });

/** 旅行期間の日付の選択肢（「1日目 - 10月7日(水)」） */
export const tripDateOptions = (startDate?: string, endDate?: string) => {
  if (!startDate || !endDate) return [];
  const options: { value: string; label: string }[] = [];
  const current = parseLocalDate(startDate.slice(0, 10));
  const end = parseLocalDate(endDate.slice(0, 10));
  let dayNumber = 1;
  while (current <= end) {
    const value = toDateString(current);
    options.push({ value, label: `${dayNumber}日目 - ${formatDocumentDate(value)}` });
    current.setDate(current.getDate() + 1);
    dayNumber++;
  }
  return options;
};

/** アクティビティの種別から、情報タブのカテゴリーの初期値を決める */
export const categoryForActivityType = (type?: string) => {
  switch (type) {
    case 'transport':
      return 'transport';
    case 'hotel':
      return 'hotel';
    case 'sightseeing':
    case 'activity':
      return 'ticket';
    default:
      return 'other';
  }
};

interface CreateTravelDocumentInput {
  itineraryId: number;
  title: string;
  category: string;
  date: string | null;
  files: File[];
}

/** ファイルをアップロードして情報タブに1件登録する。情報タブの一覧も取り直す */
export const useCreateTravelDocument = () => {
  const [insertDocument] = useMutation(INSERT_TRAVEL_DOCUMENT, {
    refetchQueries: ['GetTravelDocuments'],
  });

  return async ({ itineraryId, title, category, date, files }: CreateTravelDocumentInput) => {
    const uploadedFiles = await Promise.all(
      files.map((file) => uploadToCloudinary(file, `travel-planner/${itineraryId}/documents`))
    );

    await insertDocument({
      variables: {
        itinerary_id: itineraryId,
        title: title.trim() || files[0]?.name.replace(/\.[^/.]+$/, '') || category,
        category,
        date: date || null,
        reservation_number: null,
        notes: null,
        files: uploadedFiles.map((file, index) => ({
          file_url: file.file_url,
          file_type: file.file_type,
          file_name: file.file_name,
          file_size: file.file_size,
          mime_type: file.mime_type,
          cloudinary_public_id: file.cloudinary_public_id,
          display_order: index,
        })),
      },
    });
  };
};
