export const onRequest: PagesFunction = async ({ request, env }) => {
  try {
    const { providerId, prompt } = await request.json<any>();
    if (!providerId || !prompt) {
      return new Response(JSON.stringify({ error: "bad request" }), {
        status: 400,
      });
    }
    let apiKey = "";
    let url = "";
    let body: any = {};
    if (providerId === "openai" && (env as any).OPENAI_API_KEY) {
      apiKey = (env as any).OPENAI_API_KEY as string;
      url = "https://api.openai.com/v1/chat/completions";
      body = {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      };
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const j = await r.json<any>();
      const text = j?.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ text }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (providerId === "anthropic" && (env as any).ANTHROPIC_API_KEY) {
      apiKey = (env as any).ANTHROPIC_API_KEY as string;
      url = "https://api.anthropic.com/v1/messages";
      body = {
        model: "claude-3-5-sonnet-latest",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      };
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
      });
      const j = await r.json<any>();
      const text = j?.content?.[0]?.text ?? "";
      return new Response(JSON.stringify({ text }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (providerId === "openrouter" && (env as any).OPENROUTER_API_KEY) {
      apiKey = (env as any).OPENROUTER_API_KEY as string;
      url = "https://openrouter.ai/api/v1/chat/completions";
      body = {
        model: "meta-llama/llama-3.1-405b-instruct",
        messages: [{ role: "user", content: prompt }],
      };
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });
      const j = await r.json<any>();
      const text = j?.choices?.[0]?.message?.content ?? "";
      return new Response(JSON.stringify({ text }), {
        headers: { "content-type": "application/json" },
      });
    }
    if (providerId === "google" && (env as any).GOOGLE_API_KEY) {
      apiKey = (env as any).GOOGLE_API_KEY as string;
      url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
      body = { contents: [{ parts: [{ text: prompt }] }] };
      const r = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = await r.json<any>();
      const text = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      return new Response(JSON.stringify({ text }), {
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "provider not available" }), {
      status: 400,
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
    });
  }
};
