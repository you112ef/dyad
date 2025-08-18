export const onRequest: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider");
  if (!provider) return new Response("Missing provider", { status: 400 });

  const catalogs: Record<string, string[]> = {
    openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini", "o4-mini", "o3-mini"],
    anthropic: [
      "claude-3-7-sonnet-latest",
      "claude-3-5-sonnet",
      "claude-3-haiku",
    ],
    google: [
      "gemini-2.0-flash-exp",
      "gemini-2.0-flash-lite-preview-02-05",
      "gemini-1.5-pro",
      "gemini-1.5-flash",
    ],
    openrouter: [
      "openrouter/auto",
      "openai/gpt-4o-mini",
      "anthropic/claude-3-5-sonnet",
      "google/gemini-2.0-flash-exp",
    ],
  };

  const list = catalogs[provider] ?? [];
  return new Response(JSON.stringify(list), {
    headers: { "content-type": "application/json" },
  });
};
