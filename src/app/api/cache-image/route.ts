import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * Google Places等の外部画像URLをダウンロードしてローカル/Cloudinaryに保存する
 * CORS回避のためサーバーサイドで処理
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '画像URLが指定されていません' }, { status: 400 });
    }

    // 画像をダウンロード
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: '画像のダウンロードに失敗しました' }, { status: 502 });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await response.arrayBuffer());

    // Cloudinaryが設定されている場合はCloudinaryにアップロード
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (cloudName) {
      const formData = new FormData();
      const blob = new Blob([buffer], { type: contentType });
      formData.append('file', blob, `place-photo-${randomUUID()}.jpg`);
      formData.append('upload_preset', 'travel_planner');
      formData.append('folder', 'travel-planner/place-photos');

      const cloudinaryResponse = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        { method: 'POST', body: formData }
      );

      if (!cloudinaryResponse.ok) {
        return NextResponse.json({ error: 'Cloudinaryアップロードに失敗しました' }, { status: 502 });
      }

      const data = await cloudinaryResponse.json();
      return NextResponse.json({ cached_url: data.secure_url });
    }

    // ローカル保存
    const ext = contentType.includes('png') ? '.png' : '.jpg';
    const uniqueName = `place-${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, uniqueName), buffer);

    return NextResponse.json({ cached_url: `/uploads/${uniqueName}` });
  } catch (error) {
    console.error('Cache image error:', error);
    return NextResponse.json({ error: '画像のキャッシュに失敗しました' }, { status: 500 });
  }
}
