export const onRequest: PagesFunction = async ({ request, env }) => {
  const cookies = Object.fromEntries(
    (request.headers.get("cookie") || "")
      .split(";")
      .map((p) => p.trim().split("=").map(decodeURIComponent))
      .filter((kv) => kv.length === 2),
  );
  const sessionId = cookies["gh_session"];
  const kv = (env as any).SESSIONS_KV as KVNamespace | undefined;
  if (!sessionId || !kv) {
    return new Response("{}", {
      headers: { "content-type": "application/json" },
    });
  }
  const data = await kv.get(`sess:${sessionId}`);
  return new Response(data || "{}", {
    headers: { "content-type": "application/json" },
  });
};
