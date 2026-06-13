import { NextRequest, NextResponse } from 'next/server';

const HASURA_ENDPOINT = process.env.HASURA_GRAPHQL_ENDPOINT;
const HASURA_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET;

export async function POST(req: NextRequest) {
  if (!HASURA_ENDPOINT || !HASURA_ADMIN_SECRET) {
    return NextResponse.json(
      { errors: [{ message: 'GraphQL endpoint is not configured' }] },
      { status: 500 }
    );
  }

  const body = await req.text();

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
