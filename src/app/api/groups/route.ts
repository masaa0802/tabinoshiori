import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const HASURA_ENDPOINT =
  process.env.HASURA_GRAPHQL_ENDPOINT ??
  process.env.NEXT_PUBLIC_HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET =
  process.env.HASURA_GRAPHQL_ADMIN_SECRET;

// グループと最初の旅程を1回で作る。
// トークン（= しおりのURL）はサーバーで作り、クライアントには作成後に返すだけにする。
// group_member ロールには groups / itineraries の insert 権限を与えないので、作成の入口はここだけ。
// 旅程側から group をネストして insert するので、グループだけ残る、といった中途半端な状態にならない
const CREATE_GROUP_WITH_ITINERARY = `
  mutation CreateGroupWithItinerary(
    $name: String!
    $token: String!
    $title: String!
    $destination: String
    $start_date: date!
    $end_date: date!
    $travel_purpose: String
    $location_type: String!
  ) {
    insert_itineraries_one(
      object: {
        title: $title
        destination: $destination
        start_date: $start_date
        end_date: $end_date
        travel_purpose: $travel_purpose
        location_type: $location_type
        group: { data: { name: $name, token: $token } }
      }
    ) {
      id
    }
  }
`;

const LOCATION_TYPES = new Set(['domestic', 'overseas']);
// DB の VARCHAR(255) に合わせる
const MAX_TEXT_LENGTH = 255;

// 作成は1人がそう何度も行う操作ではないので、/api/graphql より厳しくする（10回/10分）
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
    rateLimiter.set(ip, { count: 1, resetAt: now + 10 * 60_000 });
    return false;
  }
  if (entry.count >= 10) return true;
  entry.count++;
  return false;
}

function isDateString(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function optionalText(value: unknown): string | null | undefined {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string' || value.length > MAX_TEXT_LENGTH) return undefined;
  return value;
}

// トークンはグループURLそのもので、知っていればグループを操作できる。推測されないよう 128bit の乱数で作る
function generateGroupToken(): string {
  return randomBytes(16).toString('hex');
}

export async function POST(req: NextRequest) {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    return NextResponse.json({ error: 'GraphQL endpoint is not configured' }, { status: 500 });
  }

  if (isRateLimited(getClientIP(req))) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let input: Record<string, unknown>;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
  if (!input || typeof input !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const destination = optionalText(input.destination);
  const travelPurpose = optionalText(input.travel_purpose);
  const { start_date: startDate, end_date: endDate, location_type: locationType } = input;

  if (!name || name.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (!isDateString(startDate) || !isDateString(endDate) || startDate > endDate) {
    return NextResponse.json({ error: 'invalid start_date / end_date' }, { status: 400 });
  }
  if (typeof locationType !== 'string' || !LOCATION_TYPES.has(locationType)) {
    return NextResponse.json({ error: 'invalid location_type' }, { status: 400 });
  }
  if (destination === undefined || travelPurpose === undefined) {
    return NextResponse.json({ error: 'invalid destination / travel_purpose' }, { status: 400 });
  }

  const token = generateGroupToken();

  try {
    const res = await fetch(HASURA_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-hasura-admin-secret': HASURA_ADMIN_SECRET,
      },
      body: JSON.stringify({
        query: CREATE_GROUP_WITH_ITINERARY,
        variables: {
          name,
          token,
          title: name,
          destination,
          start_date: startDate,
          end_date: endDate,
          travel_purpose: travelPurpose,
          location_type: locationType,
        },
      }),
    });

    const data = await res.json();
    const itineraryId = data?.data?.insert_itineraries_one?.id;
    if (!res.ok || data?.errors || typeof itineraryId !== 'number') {
      console.error('グループの作成に失敗しました:', data?.errors ?? res.status);
      return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
    }

    return NextResponse.json({ token, itineraryId }, { status: 201 });
  } catch (error) {
    console.error('グループの作成に失敗しました:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
