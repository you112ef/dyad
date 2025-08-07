export const onRequest: PagesFunction = async ({ env }) => {
  const providers = [
    { id: "openai", name: "OpenAI", type: "cloud", env: "OPENAI_API_KEY" },
    { id: "anthropic", name: "Anthropic", type: "cloud", env: "ANTHROPIC_API_KEY" },
    { id: "google", name: "Google", type: "cloud", env: "GOOGLE_API_KEY" },
    { id: "openrouter", name: "OpenRouter", type: "cloud", env: "OPENROUTER_API_KEY" },
  ];

  const available = providers
    .filter((p) => !!(env as any)[p.env])
    .map(({ env: _env, ...rest }) => rest);

  return new Response(JSON.stringify(available), {
    headers: { "content-type": "application/json" },
  });
};