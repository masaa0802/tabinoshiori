import { NextRequest, NextResponse } from 'next/server';
import { validateGroupToken } from '@/lib/validate-group-token';
import { parse, Kind, type SelectionSetNode } from 'graphql';

const HASURA_ENDPOINT =
  process.env.HASURA_GRAPHQL_ENDPOINT ??
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET =
  process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// グループ未作成時に呼ばれる操作（トークン不要）
// operationName は自己申告なので、query を parse して中身が src/graphql/mutates.ts の
// INSERT_GROUP / INSERT_ITINERARY と同じ形になっているかを確かめる
const PUBLIC_OPERATIONS: Record<string, { rootField: string; columns: Set<string> }> = {
  InsertGroup: {
    rootField: 'insert_groups',
    columns: new Set(['name', 'token']),
  },
  InsertItinerary: {
    rootField: 'insert_itineraries',
    columns: new Set([
      'group_id',
      'title',
      'destination',
      'start_date',
      'end_date',
      'travel_purpose',
      'location_type',
      'created_by',
    ]),
  },
};

// 結果の取り出し方は { affected_rows, returning { <列> } } だけ許す
// （リレーションをたどって他グループのデータを読まれないよう、returning の下は葉のフィールドのみ）
function isAllowedResultSelection(selectionSet: SelectionSetNode | undefined): boolean {
  if (!selectionSet) return false;
  return selectionSet.selections.every((sel) => {
    if (sel.kind !== Kind.FIELD || sel.alias || sel.arguments?.length || sel.directives?.length) {
      return false;
    }
    switch (sel.name.value) {
      case '__typename':
      case 'affected_rows':
        return !sel.selectionSet;
      case 'returning':
        return (
          !!sel.selectionSet &&
          sel.selectionSet.selections.every(
            (col) =>
              col.kind === Kind.FIELD &&
              !col.alias &&
              !col.arguments?.length &&
              !col.directives?.length &&
              !col.selectionSet
          )
        );
      default:
        return false;
    }
  });
}

function isPublicOperation(query: unknown, operationName: string | null): boolean {
  if (!operationName || !Object.prototype.hasOwnProperty.call(PUBLIC_OPERATIONS, operationName)) return false;
  if (typeof query !== 'string') return false;
  const spec = PUBLIC_OPERATIONS[operationName];

  let doc;
  try {
    doc = parse(query);
  } catch {
    return false;
  }

  // operation は1つだけ（フラグメントや別の operation の同居も認めない）
  if (doc.definitions.length !== 1) return false;
  const op = doc.definitions[0];
  if (op.kind !== Kind.OPERATION_DEFINITION) return false;
  if (op.operation !== 'mutation') return false;
  if (op.name?.value !== operationName) return false;
  if (op.directives?.length) return false;

  // ルートフィールドは想定の insert_* 1つだけ
  if (op.selectionSet.selections.length !== 1) return false;
  const root = op.selectionSet.selections[0];
  if (root.kind !== Kind.FIELD || root.alias || root.directives?.length) return false;
  if (root.name.value !== spec.rootField) return false;

  // 引数は objects のみ（on_conflict による既存行の上書きを防ぐ）。
  // objects は列名を並べたオブジェクトリテラルで、列は許可リストのものだけ
  // （リレーション経由のネスト insert を防ぐ）
  if (root.arguments?.length !== 1) return false;
  const arg = root.arguments[0];
  if (arg.name.value !== 'objects' || arg.value.kind !== Kind.OBJECT) return false;
  if (!arg.value.fields.every((f) => spec.columns.has(f.name.value))) return false;

  return isAllowedResultSelection(root.selectionSet);
}

// シンプルなIPベースのレートリミッター（60req/分）
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);
  if (!entry || now >= entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  if (entry.count >= 60) return true;
  entry.count++;
  return false;
}

export async function POST(req: NextRequest) {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    return NextResponse.json(
      { errors: [{ message: 'GraphQL endpoint is not configured' }] },
      { status: 500 }
    );
  }

  // レート制限
  const ip = getClientIP(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { errors: [{ message: 'Too many requests' }] },
      { status: 429 }
    );
  }

  const body = await req.text();

  let isPublic = false;
  try {
    const parsed = JSON.parse(body);
    const operationName =
      typeof parsed?.operationName === 'string' ? parsed.operationName : null;
    isPublic = isPublicOperation(parsed?.query, operationName);
  } catch {
    return NextResponse.json(
      { errors: [{ message: 'Invalid request body' }] },
      { status: 400 }
    );
  }

  // パブリック操作以外はグループトークン必須
  if (!isPublic) {
    const groupToken = req.headers.get('x-group-token');
    if (!groupToken) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized' }] },
        { status: 401 }
      );
    }
    const valid = await validateGroupToken(groupToken);
    if (!valid) {
      return NextResponse.json(
        { errors: [{ message: 'Unauthorized: invalid group token' }] },
        { status: 403 }
      );
    }
  }

  const res = await fetch(HASURA_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
    },
    body,
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
