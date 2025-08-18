import { ensureSchema, type EnvWithDb } from "./_db";

export const onRequest: PagesFunction = async ({ request, env }) => {
  const db = (env as any as EnvWithDb).DYAD_DB;
  if (!db) return json({ error: "Missing D1 binding DYAD_DB" }, 500);
  await ensureSchema(env as any);
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "GET") {
    const appId = url.searchParams.get("appId");
    if (!appId) return json({ error: "Missing appId" }, 400);
    const rows = await db
      .prepare(
        "SELECT id, appId, title, createdAt FROM chats WHERE appId = ? ORDER BY id DESC",
      )
      .bind(appId)
      .all();
    return json(rows.results || []);
  }
  if (method === "POST") {
    const { appId, title } = await request.json<any>();
    if (!appId) return json({ error: "Missing appId" }, 400);
    const name = title || "New Chat";
    const now = new Date().toISOString();
    const res = await db
      .prepare("INSERT INTO chats (appId, title, createdAt) VALUES (?, ?, ?)")
      .bind(appId, name, now)
      .run();
    return json({ id: res.lastInsertRowId });
  }
  if (method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    await db.prepare("DELETE FROM messages WHERE chatId = ?").bind(id).run();
    await db.prepare("DELETE FROM chats WHERE id = ?").bind(id).run();
    return json({ ok: true });
  }
  return new Response("Method Not Allowed", { status: 405 });
};

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
