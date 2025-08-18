import { ensureSchema, type EnvWithDb } from "./_db";

export const onRequest: PagesFunction = async ({ request, env }) => {
  const db = (env as any as EnvWithDb).DYAD_DB;
  if (!db) return j({ error: "Missing D1 binding DYAD_DB" }, 500);
  await ensureSchema(env as any);
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "GET") {
    const chatId = url.searchParams.get("chatId");
    if (!chatId) return j({ error: "Missing chatId" }, 400);
    const rows = await db
      .prepare(
        "SELECT id, role, content, createdAt FROM messages WHERE chatId = ? ORDER BY id ASC",
      )
      .bind(chatId)
      .all();
    return j(rows.results || []);
  }
  if (method === "POST") {
    const { chatId, role, content } = await request.json<any>();
    if (!chatId || !role) return j({ error: "Missing chatId or role" }, 400);
    const now = new Date().toISOString();
    const res = await db
      .prepare(
        "INSERT INTO messages (chatId, role, content, createdAt) VALUES (?, ?, ?, ?)",
      )
      .bind(chatId, role, content ?? "", now)
      .run();
    return j({ id: res.lastInsertRowId });
  }
  if (method === "DELETE") {
    const chatId = url.searchParams.get("chatId");
    if (!chatId) return j({ error: "Missing chatId" }, 400);
    await db
      .prepare("DELETE FROM messages WHERE chatId = ?")
      .bind(chatId)
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
