import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { validateGroupToken } from '@/lib/validate-group-token';

/**
 * Google Places等の外部画像URLをダウンロードしてローカル/Cloudinaryに保存する
 * CORS回避のためサーバーサイドで処理
 */

// フェッチを許可するドメイン（SSRF対策）
const ALLOWED_HOSTNAMES = new Set([
  'maps.googleapis.com',
  'maps.gstatic.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
  'streetviewpixels-pa.googleapis.com',
  'res.cloudinary.com',
]);

function isAllowedImageUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;
    if (ALLOWED_HOSTNAMES.has(url.hostname)) return true;
    // *.googleusercontent.com および *.googleapis.com のサブドメインを許可
    if (url.hostname.endsWith('.googleusercontent.com')) return true;
    if (url.hostname.endsWith('.googleapis.com')) return true;
    return false;
  } catch {
    return false;
  }
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

    const { url } = await request.json();

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: '画像URLが指定されていません' }, { status: 400 });
    }

    // SSRFガード: ドメインホワイトリスト検証
    if (!isAllowedImageUrl(url)) {
      return NextResponse.json({ error: '許可されていない画像URLです' }, { status: 400 });
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
