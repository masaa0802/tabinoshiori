/**
 * ファイルアップロードユーティリティ
 * ローカル: /api/upload (public/uploads/ に保存)
 * 本番: Cloudinary API
 */

export interface UploadedFile {
  file_url: string;
  file_type: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  cloudinary_public_id: string;
}

/**
 * 環境に応じてアップロード先を切り替え
 */
function useCloudinary(): boolean {
  return !!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
}

/**
 * URLからグループトークンを取得
 */
function getGroupTokenFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const match = window.location.pathname.match(/\/group\/([^/]+)/);
  return match ? match[1] : null;
}

/**
 * ローカルAPIにファイルをアップロード
 */
async function uploadLocal(file: File): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);

  const groupToken = getGroupTokenFromUrl();
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: groupToken ? { 'x-group-token': groupToken } : {},
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'アップロードに失敗しました');
  }

  return response.json();
}

/**
 * Cloudinaryにファイルをアップロード
 */
async function uploadCloudinary(file: File, folder: string): Promise<UploadedFile> {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const isPdf = file.type === 'application/pdf';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'travel_planner');
  formData.append('folder', folder);

  // PDFはrawとして保存しないと、Cloudinaryのセキュリティ設定によりブラウザから直接開けない
  const resourceType = isPdf ? 'raw' : 'auto';
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`);
  }

  const data = await response.json();

  let fileType = 'other';
  if (isPdf) fileType = 'pdf';
  else if (data.resource_type === 'image') fileType = 'image';

  return {
    file_url: data.secure_url,
    file_type: fileType,
    file_name: file.name,
    file_size: data.bytes,
    mime_type: file.type,
    cloudinary_public_id: data.public_id,
  };
}

/**
 * ファイルをアップロード（環境に応じて自動切り替え）
 */
export async function uploadToCloudinary(
  file: File,
  folder: string = 'travel-planner/documents'
): Promise<UploadedFile> {
  try {
    if (useCloudinary()) {
      return await uploadCloudinary(file, folder);
    }
    return await uploadLocal(file);
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error('ファイルのアップロードに失敗しました');
  }
}

/**
 * ファイルサイズを人間が読みやすい形式に変換
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * ファイルバリデーション
 */
export function validateFile(
  file: File,
  maxSize: number = 10 * 1024 * 1024,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
): { valid: boolean; error?: string } {
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `ファイルサイズが大きすぎます。最大${formatFileSize(maxSize)}まで対応しています。`,
    };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'このファイル形式には対応していません。PDF、JPG、PNGファイルをアップロードしてください。',
    };
  }

  return { valid: true };
}
