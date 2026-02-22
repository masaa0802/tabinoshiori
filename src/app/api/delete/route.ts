import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary URLからresource_typeとpublic_idを抽出
// 例: https://res.cloudinary.com/demo/image/upload/v1234/travel-planner/documents/file.jpg
//   → { resourceType: "image", publicId: "travel-planner/documents/file" }
function extractFromUrl(url: string): { resourceType: string; publicId: string } | null {
  const match = url.match(/res\.cloudinary\.com\/[^/]+\/([^/]+)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
  if (!match) return null;
  return { resourceType: match[1], publicId: match[2] };
}

export async function DELETE(request: NextRequest) {
  try {
    const { file_url } = await request.json();

    if (!file_url) {
      return NextResponse.json({ error: "file_urlが必要です" }, { status: 400 });
    }

    const extracted = extractFromUrl(file_url);
    if (!extracted) {
      return NextResponse.json({ error: "URLの解析に失敗しました" }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(extracted.publicId, {
      resource_type: extracted.resourceType as "image" | "raw" | "video",
    });

    // "not found" はすでに存在しない場合。どちらも成功として扱う
    if (result.result !== "ok" && result.result !== "not found") {
      return NextResponse.json({ error: "Cloudinaryからの削除に失敗しました" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
}
