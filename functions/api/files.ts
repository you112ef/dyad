import { ensureSchema, type EnvWithDb } from "./_db";

export const onRequest: PagesFunction = async ({ request, env }) => {
  const db = (env as any as EnvWithDb).DYAD_DB;
  if (!db) return j({ error: "Missing D1 binding DYAD_DB" }, 500);
  await ensureSchema(env as any);
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "GET") {
    const appId = url.searchParams.get("appId");
    const path = url.searchParams.get("path");
    const list = url.searchParams.get("list");
    if (list && appId) {
      const rows = await db
        .prepare("SELECT path FROM files WHERE appId = ? ORDER BY path")
        .bind(appId)
        .all();
      return j((rows.results || []).map((r: any) => r.path));
    }
    if (!appId || !path) return j({ error: "Missing appId or path" }, 400);
    const row = await db
      .prepare("SELECT content FROM files WHERE appId = ? AND path = ?")
      .bind(appId, path)
      .first();
    return j({ content: row?.content ?? "" });
  }

  if (method === "PUT" || method === "POST") {
    const { appId, path, content } = await request.json<any>();
    if (!appId || !path) return j({ error: "Missing appId or path" }, 400);
    const now = new Date().toISOString();
    await db
      .prepare(
        "INSERT INTO files (appId, path, content, updatedAt) VALUES (?, ?, ?, ?) ON CONFLICT(appId, path) DO UPDATE SET content=excluded.content, updatedAt=excluded.updatedAt",
      )
      .bind(appId, path, content ?? "", now)
      .run();
    return j({ ok: true });
  }

  return new Response("Method Not Allowed", { status: 405 });
};

const j = (d: any, s = 200) =>
  new Response(JSON.stringify(d), {
    status: s,
    headers: { "content-type": "application/json" },
  });
