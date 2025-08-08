export const onRequest: PagesFunction = async ({ request, env }) => {
  try {
    const method = request.method || "GET";
    let providerId: string | null = null;
    let clientKey: string | undefined;

    if (method === "POST") {
      const body = await request.json<any>().catch(() => ({}));
      providerId = body?.providerId ?? null;
      clientKey = body?.clientKey;
    } else {
      const url = new URL(request.url);
      providerId = url.searchParams.get("providerId");
    }

    if (!providerId) {
      return new Response(JSON.stringify({ error: "Missing providerId" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const ok = (data: any) =>
      new Response(JSON.stringify(data), {
        headers: { "content-type": "application/json" },
      });

    // Helpers to normalize model items
    type ModelItem = { apiName: string; displayName: string; description: string };
    const mapList = (items: ModelItem[]) => items.map((m) => ({ ...m, type: "cloud" }));

    // Utility to choose key: prefer server env, otherwise clientKey
    const pickKey = (serverKey: string | undefined): string | undefined => {
      return serverKey || clientKey;
    };

    switch (providerId) {
      case "openai": {
        const apiKey = pickKey((env as any).OPENAI_API_KEY as string | undefined);
        if (!apiKey) return ok([]);
        // OpenAI /v1/models returns lots of entries (incl. embeddings). Filter heuristically.
        const res = await fetch("https://api.openai.com/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.data || [])
          .map((m: any) => m.id as string)
          .filter((id: string) => /gpt|o3|4o/i.test(id))
          .slice(0, 50)
          .map<ModelItem>((id: string) => ({ apiName: id, displayName: id, description: "" }));
        return ok(mapList(models));
      }
      case "anthropic": {
        const apiKey = pickKey((env as any).ANTHROPIC_API_KEY as string | undefined);
        if (!apiKey) return ok([]);
        const res = await fetch("https://api.anthropic.com/v1/models", {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
        });
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.data || []).map((m: any) => ({
          apiName: m.id,
          displayName: m.display_name || m.id,
          description: m.name || "",
        }));
        return ok(mapList(models));
      }
      case "google": {
        const apiKey = pickKey((env as any).GEMINI_API_KEY as string | undefined);
        if (!apiKey) return ok([]);
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
        );
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.models || [])
          .filter((m: any) => /gemini/i.test(m.name))
          .map((m: any) => ({
            apiName: m.name.replace(/^models\//, ""),
            displayName: m.displayName || m.name,
            description: m.description || "",
          }));
        return ok(mapList(models));
      }
      case "openrouter": {
        const apiKey = pickKey((env as any).OPENROUTER_API_KEY as string | undefined);
        // OpenRouter /models does not require key but helps with quotas
        const res = await fetch("https://openrouter.ai/api/v1/models", {
          headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
        });
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.data || []).map((m: any) => ({
          apiName: m.id,
          displayName: m.name || m.id,
          description: m.description || "",
        }));
        return ok(mapList(models));
      }
      case "groq": {
        const apiKey = pickKey((env as any).GROQ_API_KEY as string | undefined);
        if (!apiKey) return ok([]);
        const res = await fetch("https://api.groq.com/openai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.data || []).map((m: any) => ({
          apiName: m.id,
          displayName: m.id,
          description: "",
        }));
        return ok(mapList(models));
      }
      case "mistral": {
        const apiKey = pickKey((env as any).MISTRAL_API_KEY as string | undefined);
        if (!apiKey) return ok([]);
        const res = await fetch("https://api.mistral.ai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.data || []).map((m: any) => ({
          apiName: m.id,
          displayName: m.name || m.id,
          description: m.description || "",
        }));
        return ok(mapList(models));
      }
      case "xai": {
        const apiKey = pickKey((env as any).XAI_API_KEY as string | undefined);
        if (!apiKey) return ok([]);
        const res = await fetch("https://api.x.ai/v1/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.data || []).map((m: any) => ({
          apiName: m.id,
          displayName: m.id,
          description: "",
        }));
        return ok(mapList(models));
      }
      case "deepseek": {
        const apiKey = pickKey((env as any).DEEPSEEK_API_KEY as string | undefined);
        if (!apiKey) return ok([]);
        const res = await fetch("https://api.deepseek.com/models", {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        if (!res.ok) return ok([]);
        const data: any = await res.json();
        const models = (data.data || data.models || []).map((m: any) => ({
          apiName: m.id || m.name,
          displayName: m.name || m.id,
          description: m.description || "",
        }));
        return ok(mapList(models));
      }
      default:
        return ok([]);
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};