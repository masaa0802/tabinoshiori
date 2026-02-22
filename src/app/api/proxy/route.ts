import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return new NextResponse("urlが必要です", { status: 400 });
  }

  // Cloudinary URLのみ許可（SSRF対策）
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "res.cloudinary.com") {
      return new NextResponse("許可されていないURLです", { status: 403 });
    }
  } catch {
    return new NextResponse("無効なURLです", { status: 400 });
  }

  const upstream = await fetch(url);
  if (!upstream.ok) {
    return new NextResponse("ファイルの取得に失敗しました", { status: 502 });
  }

  // ブラウザでインライン表示させる
  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
    },
  });
}
