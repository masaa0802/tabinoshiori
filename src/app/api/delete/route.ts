import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { validateGroupToken } from "@/lib/validate-group-token";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_RESOURCE_TYPES = ["image", "raw", "video"] as const;
type ResourceType = (typeof ALLOWED_RESOURCE_TYPES)[number];

function isAllowedResourceType(value: string): value is ResourceType {
  return (ALLOWED_RESOURCE_TYPES as readonly string[]).includes(value);
}

// Cloudinary URLからresource_typeとpublic_idを抽出
// 例: https://res.cloudinary.com/demo/image/upload/v1234/travel-planner/documents/file.jpg
//   → { resourceType: "image", publicId: "travel-planner/documents/file" }
function extractFromUrl(url: string): { resourceType: ResourceType; publicId: string } | null {
  const match = url.match(/^https:\/\/res\.cloudinary\.com\/([^/]+)\/([^/]+)\/upload\/(?:v\d+\/)?(.+?)(?:\.[^./]+)?$/);
  if (!match) return null;
  const [, cloudName, resourceType, publicId] = match;
  // 自分のクラウド以外のURLは扱わない
  if (cloudName !== process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) return null;
  if (!isAllowedResourceType(resourceType)) return null;
  return { resourceType, publicId };
}

/**
 * file_url のファイルがトークンのグループだけに属しているかを Hasura で確認する。
 * 他グループの行が同じ URL を指している場合も拒否する
 * （自グループに他人の URL を登録してから削除する、という迂回を防ぐため）。
 */
async function isFileOwnedByGroup(fileUrl: string, groupToken: string): Promise<boolean> {
  const HASURA_ENDPOINT =
    process.env.HASURA_GRAPHQL_ENDPOINT ??
    process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
  const HASURA_ADMIN_SECRET =
    process.env.HASURA_GRAPHQL_ADMIN_SECRET;

  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) return false;

  const res = await fetch(HASURA_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: `query FileOwnership($token: String!, $file_url: String!) {
        groups(where: { token: { _eq: $token } }) { id }
        document_files(where: { file_url: { _eq: $file_url } }) {
          travel_document { itinerary { group_id } }
        }
      }`,
      variables: { token: groupToken, file_url: fileUrl },
    }),
  });

  const data = await res.json();
  const groups: { id: string }[] | undefined = data?.data?.groups;
  const files: { travel_document?: { itinerary?: { group_id?: string } } }[] | undefined =
    data?.data?.document_files;
  if (!Array.isArray(groups) || groups.length !== 1) return false;
  if (!Array.isArray(files) || files.length === 0) return false;

  const groupId = groups[0].id;
  return files.every((file) => file.travel_document?.itinerary?.group_id === groupId);
}

export async function DELETE(request: NextRequest) {
  try {
    // グループトークン認証
    const groupToken = request.headers.get("x-group-token");
    if (!groupToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const isValid = await validateGroupToken(groupToken);
    if (!isValid) {
      return NextResponse.json({ error: "Unauthorized: invalid group token" }, { status: 403 });
    }

    const { file_url } = await request.json();

    if (!file_url || typeof file_url !== "string") {
      return NextResponse.json({ error: "file_urlが必要です" }, { status: 400 });
    }

    const extracted = extractFromUrl(file_url);
    if (!extracted) {
      return NextResponse.json({ error: "URLの解析に失敗しました" }, { status: 400 });
    }

    // DBの行を消す前に呼ぶこと（行が無いと所有を確認できない）
    if (!(await isFileOwnedByGroup(file_url, groupToken))) {
      return NextResponse.json({ error: "このファイルを削除する権限がありません" }, { status: 403 });
    }

    const result = await cloudinary.uploader.destroy(extracted.publicId, {
      resource_type: extracted.resourceType,
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
