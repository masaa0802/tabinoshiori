import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ファイルが選択されていません' }, { status: 400 });
    }

    // ファイルサイズチェック (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'ファイルサイズが大きすぎます（最大10MB）' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ユニークなファイル名を生成
    const ext = path.extname(file.name);
    const uniqueName = `${randomUUID()}${ext}`;

    // 保存先ディレクトリ
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const filePath = path.join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    // ファイルタイプ判定
    let fileType = 'other';
    if (file.type.startsWith('image/')) {
      fileType = 'image';
    } else if (file.type === 'application/pdf') {
      fileType = 'pdf';
    }

    return NextResponse.json({
      file_url: `/uploads/${uniqueName}`,
      file_type: fileType,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      cloudinary_public_id: uniqueName,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'アップロードに失敗しました' }, { status: 500 });
  }
}
