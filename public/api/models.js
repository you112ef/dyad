// API endpoint for language models by provider
export default async function handler(request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  let providerId;
  if (request.method === "GET") {
    const url = new URL(request.url);
    providerId = url.searchParams.get("providerId");
  } else if (request.method === "POST") {
    const body = await request.json();
    providerId = body.providerId;
  }

  if (!providerId) {
    return new Response(JSON.stringify({ error: "Provider ID required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Demo models for each provider
  const modelsByProvider = {
    openai: [
      { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000 },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000 },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", contextWindow: 128000 },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", contextWindow: 16384 },
    ],
    anthropic: [
      {
        id: "claude-3-5-sonnet-20241022",
        name: "Claude 3.5 Sonnet",
        contextWindow: 200000,
      },
      {
        id: "claude-3-5-haiku-20241022",
        name: "Claude 3.5 Haiku",
        contextWindow: 200000,
      },
      {
        id: "claude-3-opus-20240229",
        name: "Claude 3 Opus",
        contextWindow: 200000,
      },
    ],
    google: [
      {
        id: "gemini-1.5-pro-latest",
        name: "Gemini 1.5 Pro",
        contextWindow: 1048576,
      },
      {
        id: "gemini-1.5-flash-latest",
        name: "Gemini 1.5 Flash",
        contextWindow: 1048576,
      },
      { id: "gemini-pro", name: "Gemini Pro", contextWindow: 32768 },
    ],
    openrouter: [
      {
        id: "meta-llama/llama-3.1-405b-instruct",
        name: "Llama 3.1 405B",
        contextWindow: 131072,
      },
      {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        contextWindow: 200000,
      },
      { id: "openai/gpt-4o", name: "GPT-4o", contextWindow: 128000 },
    ],
    groq: [
      {
        id: "llama3-groq-70b-8192-tool-use-preview",
        name: "Llama 3 70B Tool Use",
        contextWindow: 8192,
      },
      {
        id: "llama-3.1-70b-versatile",
        name: "Llama 3.1 70B",
        contextWindow: 131072,
      },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", contextWindow: 32768 },
    ],
    mistral: [
      {
        id: "mistral-large-latest",
        name: "Mistral Large",
        contextWindow: 128000,
      },
      {
        id: "mistral-medium-latest",
        name: "Mistral Medium",
        contextWindow: 32000,
      },
      {
        id: "mistral-small-latest",
        name: "Mistral Small",
        contextWindow: 32000,
      },
    ],
  };

  const models = modelsByProvider[providerId] || [];

  return new Response(JSON.stringify(models), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
