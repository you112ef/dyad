import { ensureSchema } from "./_db";

export const onRequest = async ({ request, env }: any) => {
  const db = (env as any).DYAD_DB;
  if (!db)
    return new Response(
      JSON.stringify({ error: "Missing D1 binding DYAD_DB" }),
      { status: 500 },
    );
  await ensureSchema(env as any);

  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === "GET") {
    const id = url.searchParams.get("id");
    if (id) {
      const app = await db
        .prepare("SELECT * FROM apps WHERE id = ?")
        .bind(id)
        .first();
      return json(app || null);
    }
    const apps = await db.prepare("SELECT * FROM apps ORDER BY id DESC").all();
    return json(apps.results || []);
  }

  if (method === "POST") {
    const { name } = await request.json();
    if (!name) return json({ error: "Missing name" }, 400);
    const now = new Date().toISOString();
    const result = await db
      .prepare("INSERT INTO apps (name, createdAt, updatedAt) VALUES (?, ?, ?)")
      .bind(name, now, now)
      .run();
    const appId = result.lastInsertRowId as number;
    await db
      .prepare("INSERT INTO chats (appId, title, createdAt) VALUES (?, ?, ?)")
      .bind(appId, name, now)
      .run();
    const app = await db
      .prepare("SELECT * FROM apps WHERE id = ?")
      .bind(appId)
      .first();
    return json({ app, chatId: appId ? appId : null });
  }

  if (method === "DELETE") {
    const id = url.searchParams.get("id");
    if (!id) return json({ error: "Missing id" }, 400);
    await db.prepare("DELETE FROM files WHERE appId = ?").bind(id).run();
    await db
      .prepare(
        "DELETE FROM messages WHERE chatId IN (SELECT id FROM chats WHERE appId = ?)",
      )
      .bind(id)
      .run();
    await db.prepare("DELETE FROM chats WHERE appId = ?").bind(id).run();
    await db.prepare("DELETE FROM apps WHERE id = ?").bind(id).run();
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
