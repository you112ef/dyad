export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { prompt, provider, model } = await request.json<any>();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'prompt'" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Determine provider based on explicit param or available env keys
    const candidates = [
      provider,
      (env as any).OPENAI_API_KEY ? "openai" : undefined,
      (env as any).ANTHROPIC_API_KEY ? "anthropic" : undefined,
      (env as any).GEMINI_API_KEY ? "google" : undefined,
      (env as any).OPENROUTER_API_KEY ? "openrouter" : undefined,
    ].filter(Boolean) as string[];

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No provider API keys configured on server" }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const chosen = candidates[0];

    switch (chosen) {
      case "openai": {
        const apiKey = (env as any).OPENAI_API_KEY as string;
        const endpoint = "https://api.openai.com/v1/chat/completions";
        const body = {
          model: model || "gpt-4.1-mini",
          temperature: 0.2,
          messages: [
            { role: "system", content: "You are a helpful coding assistant." },
            { role: "user", content: prompt },
          ],
        };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text();
          return new Response(
            JSON.stringify({ error: `OpenAI error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ provider: chosen, content }), {
          headers: { "content-type": "application/json" },
        });
      }
      case "openrouter": {
        const apiKey = (env as any).OPENROUTER_API_KEY as string;
        const endpoint = "https://openrouter.ai/api/v1/chat/completions";
        const body = {
          model: model || "deepseek/deepseek-chat-v3-0324:free",
          messages: [
            { role: "system", content: "You are a helpful coding assistant." },
            { role: "user", content: prompt },
          ],
        };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text();
          return new Response(
            JSON.stringify({ error: `OpenRouter error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ provider: chosen, content }), {
          headers: { "content-type": "application/json" },
        });
      }
      case "anthropic": {
        const apiKey = (env as any).ANTHROPIC_API_KEY as string;
        const endpoint = "https://api.anthropic.com/v1/messages";
        const body = {
          model: model || "claude-3-5-haiku-20241022",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text();
          return new Response(
            JSON.stringify({ error: `Anthropic error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.content?.[0]?.text ?? "";
        return new Response(JSON.stringify({ provider: chosen, content }), {
          headers: { "content-type": "application/json" },
        });
      }
      case "google": {
        const apiKey = (env as any).GEMINI_API_KEY as string;
        const gModel = model || "gemini-2.5-flash-preview-04-17";
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
          gModel,
        )}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const body = {
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
        };
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const txt = await res.text();
          return new Response(
            JSON.stringify({ error: `Google error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        return new Response(JSON.stringify({ provider: chosen, content }), {
          headers: { "content-type": "application/json" },
        });
      }
      default:
        return new Response(
          JSON.stringify({ error: `Unsupported provider: ${chosen}` }),
          { status: 400, headers: { "content-type": "application/json" } },
        );
    }
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }
};