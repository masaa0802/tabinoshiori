import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { randomUUID } from 'crypto';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { validateGroupToken } from '@/lib/validate-group-token';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 許可するMIMEタイプと対応する拡張子
const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'application/pdf': '.pdf',
};

// ファイルの magic bytes（先頭バイト列）でタイプを検証
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xff, 0xd8, 0xff]],
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]],
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
};

function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures) return false;
  return signatures.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

export async function POST(request: NextRequest) {
  try {
    // グループトークン認証
    const groupToken = request.headers.get('x-group-token');
    if (!groupToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const isValid = await validateGroupToken(groupToken);
    if (!isValid) {
      return NextResponse.json({ error: 'Unauthorized: invalid group token' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 });
    }

    // ファイルサイズチェック (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズは10MB以下にしてください' },
        { status: 413 }
      );
    }

    // MIMEタイプ許可リスト
    const declaredMimeType = file.type;
    if (!ALLOWED_MIME_TYPES[declaredMimeType]) {
      return NextResponse.json(
        { error: 'このファイル形式には対応していません（PDF、JPG、PNGのみ）' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // magic bytes でファイルの実際のタイプを検証（MIME偽装対策）
    if (!validateMagicBytes(buffer, declaredMimeType)) {
      return NextResponse.json(
        { error: 'ファイルの内容がファイル形式と一致しません' },
        { status: 400 }
      );
    }

    // Cloudinaryが設定されている場合はCloudinaryにアップロード
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      // PDFはrawとして保存しないとブラウザで直接開けない
      const resourceType = declaredMimeType === 'application/pdf' ? 'raw' : 'image';

      const result = await new Promise<{
        secure_url: string;
        public_id: string;
        bytes: number;
        format: string;
        resource_type: string;
      }>((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            { folder: 'travel-planner/documents', resource_type: resourceType },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as typeof result & { secure_url: string });
            }
          )
          .end(buffer);
      });

      let fileType = 'other';
      if (result.resource_type === 'image') fileType = 'image';
      else if (declaredMimeType === 'application/pdf') fileType = 'pdf';

      return NextResponse.json({
        file_url: result.secure_url,
        file_type: fileType,
        file_name: file.name,
        file_size: file.size,
        mime_type: declaredMimeType,
        cloudinary_public_id: result.public_id,
      });
    }

    // ローカル保存（開発環境フォールバック）
    const safeExt = ALLOWED_MIME_TYPES[declaredMimeType];
    const uniqueName = `${randomUUID()}${safeExt}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, uniqueName), buffer);

    let fileType = 'other';
    if (declaredMimeType.startsWith('image/')) fileType = 'image';
    else if (declaredMimeType === 'application/pdf') fileType = 'pdf';

    return NextResponse.json({
      file_url: `/uploads/${uniqueName}`,
      file_type: fileType,
      file_name: file.name,
      file_size: file.size,
      mime_type: declaredMimeType,
      cloudinary_public_id: uniqueName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
