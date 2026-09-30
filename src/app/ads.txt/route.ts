export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const publisherId = clientId?.replace("ca-pub-", "pub-");

  const body = publisherId
    ? `google.com, ${publisherId}, DIRECT, f08c47fec0942fa0\n`
    : "";

  return new Response(body, {
    headers: { "Content-Type": "text/plain" },
  });
}
