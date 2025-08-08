export const onRequest: PagesFunction = async ({ request, env }) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { prompt, provider, model, clientKey } = await request.json<any>();
    if (!prompt || typeof prompt !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'prompt'" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    // Determine provider based on explicit param or available env keys
    const candidates = [
      provider,
      (env as any).OPENAI_API_KEY || clientKey ? "openai" : undefined,
      (env as any).ANTHROPIC_API_KEY || clientKey ? "anthropic" : undefined,
      (env as any).GEMINI_API_KEY || clientKey ? "google" : undefined,
      (env as any).OPENROUTER_API_KEY || clientKey ? "openrouter" : undefined,
      (env as any).GROQ_API_KEY || clientKey ? "groq" : undefined,
      (env as any).MISTRAL_API_KEY || clientKey ? "mistral" : undefined,
      (env as any).XAI_API_KEY || clientKey ? "xai" : undefined,
      (env as any).DEEPSEEK_API_KEY || clientKey ? "deepseek" : undefined,
    ].filter(Boolean) as string[];

    if (candidates.length === 0) {
      return new Response(
        JSON.stringify({ error: "No provider API keys configured on server or client" }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }

    const chosen = candidates[0];

    // Utility to pick a key (server first, then clientKey)
    const pickKey = (serverKey: string | undefined) => serverKey || clientKey;

    switch (chosen) {
      case "openai": {
        const apiKey = pickKey((env as any).OPENAI_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing OpenAI API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
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
        const apiKey = pickKey((env as any).OPENROUTER_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing OpenRouter API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        const endpoint = "https://openrouter.ai/api/v1/chat/completions";
        const body = {
          model: model || "deepseek/deepseek-chat-v3-0324",
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
        const apiKey = pickKey((env as any).ANTHROPIC_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing Anthropic API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
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
        const apiKey = pickKey((env as any).GEMINI_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing Google API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
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
      case "groq": {
        const apiKey = pickKey((env as any).GROQ_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing Groq API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        const endpoint = "https://api.groq.com/openai/v1/chat/completions";
        const body = {
          model: model || "llama-3.1-8b-instant",
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
            JSON.stringify({ error: `Groq error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ provider: chosen, content }), {
          headers: { "content-type": "application/json" },
        });
      }
      case "mistral": {
        const apiKey = pickKey((env as any).MISTRAL_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing Mistral API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        const endpoint = "https://api.mistral.ai/v1/chat/completions";
        const body = {
          model: model || "mistral-small-latest",
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
            JSON.stringify({ error: `Mistral error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ provider: chosen, content }), {
          headers: { "content-type": "application/json" },
        });
      }
      case "xai": {
        const apiKey = pickKey((env as any).XAI_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing xAI API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        const endpoint = "https://api.x.ai/v1/chat/completions";
        const body = {
          model: model || "grok-2-mini",
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
            JSON.stringify({ error: `xAI error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
        return new Response(JSON.stringify({ provider: chosen, content }), {
          headers: { "content-type": "application/json" },
        });
      }
      case "deepseek": {
        const apiKey = pickKey((env as any).DEEPSEEK_API_KEY as string | undefined);
        if (!apiKey)
          return new Response(JSON.stringify({ error: "Missing DeepSeek API key" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        const endpoint = "https://api.deepseek.com/chat/completions";
        const body = {
          model: model || "deepseek-chat",
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
            JSON.stringify({ error: `DeepSeek error: ${txt}` }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
        const data: any = await res.json();
        const content = data.choices?.[0]?.message?.content ?? "";
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