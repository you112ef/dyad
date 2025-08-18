import { OpenAI } from "openai";

export const onRequest: PagesFunction = async (ctx) => {
  const { request, env } = ctx;

  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const { provider, model, messages } = body as {
    provider: string;
    model: string;
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  };

  try {
    switch (provider) {
      case "openai":
        return await streamOpenAI(
          env.OPENAI_API_KEY as string,
          model,
          messages,
        );
      case "anthropic":
        return await streamOpenRouterCompatible(
          env.ANTHROPIC_API_KEY as string,
          "https://api.anthropic.com/v1/messages",
          model,
          messages,
          {
            "x-api-key": env.ANTHROPIC_API_KEY as string,
            "anthropic-version": "2023-06-01",
          },
        );
      case "google":
        return await streamOpenRouterCompatible(
          env.GOOGLE_API_KEY as string,
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          model,
          messages,
          {
            Authorization: `Bearer ${env.GOOGLE_API_KEY as string}`,
          },
        );
      case "openrouter":
        return await streamOpenRouterCompatible(
          env.OPENROUTER_API_KEY as string,
          "https://openrouter.ai/api/v1/chat/completions",
          model,
          messages,
          {
            Authorization: `Bearer ${env.OPENROUTER_API_KEY as string}`,
          },
        );
      default:
        return new Response("Unknown provider", { status: 400 });
    }
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message || String(err) }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
};

async function streamOpenAI(
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
) {
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const client = new OpenAI({ apiKey, baseURL: "https://api.openai.com/v1" });
  const stream = await client.chat.completions.create({
    model,
    messages,
    stream: true,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const token = chunk.choices?.[0]?.delta?.content ?? "";
        if (token) controller.enqueue(encoder.encode(token));
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

async function streamOpenRouterCompatible(
  apiKey: string,
  url: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  extraHeaders: Record<string, string>,
) {
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "Missing API key" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      stream: true,
      messages,
    }),
  });

  if (!resp.body) {
    return new Response(JSON.stringify({ error: "No body from provider" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  // Parse SSE and emit plain text tokens
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = resp.body.getReader();
  let buffer = "";

  const stream = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === "[DONE]") continue;
        try {
          const json = JSON.parse(payload);
          const token =
            json.choices?.[0]?.delta?.content ??
            json.delta?.text ??
            json.message?.content ??
            (Array.isArray(json.content)
              ? json.content.map((c: any) => c.text).join("")
              : json.content) ??
            "";
          if (token) controller.enqueue(encoder.encode(token));
        } catch {
          // ignore
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
