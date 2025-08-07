let memory: Record<string, any> = {};

export const onRequest: PagesFunction = async ({ request, env, data }) => {
  const key = "settings";
  const method = request.method.toUpperCase();
  const kv = (env as any).SETTINGS_KV as KVNamespace | undefined;

  if (method === "GET") {
    const value = kv ? await kv.get(key) : memory[key];
    return new Response(value || "{}", { headers: { "content-type": "application/json" } });
  }

  if (method === "PUT" || method === "POST") {
    const body = await request.text();
    if (kv) await kv.put(key, body);
    else memory[key] = body;
    return new Response(body, { headers: { "content-type": "application/json" } });
  }

  return new Response("Method Not Allowed", { status: 405 });
};