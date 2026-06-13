import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { validateGroupToken } from '@/lib/validate-group-token';

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
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    // ファイルサイズチェック (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'ファイルサイズが大きすぎます（最大10MB）' },
        { status: 400 }
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

    // 安全な拡張子を使用（クライアントが送るファイル名は使わない）
    const safeExt = ALLOWED_MIME_TYPES[declaredMimeType];
    const uniqueName = `${randomUUID()}${safeExt}`;

    // 保存先ディレクトリ
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

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
