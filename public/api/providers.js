// API endpoint for language model providers
export default async function handler(request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // Return demo providers
  const providers = [
    {
      id: "openai",
      name: "OpenAI",
      type: "cloud",
      hasFreeTier: false,
      websiteUrl: "https://platform.openai.com/api-keys",
      description: "GPT-4, GPT-3.5-turbo وغيرها من نماذج OpenAI",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      type: "cloud",
      hasFreeTier: false,
      websiteUrl: "https://console.anthropic.com/settings/keys",
      description: "نماذج Claude المتقدمة",
    },
    {
      id: "google",
      name: "Google",
      type: "cloud",
      hasFreeTier: true,
      websiteUrl: "https://aistudio.google.com/app/apikey",
      description: "Gemini وPaLM من Google",
    },
    {
      id: "openrouter",
      name: "OpenRouter",
      type: "cloud",
      hasFreeTier: true,
      websiteUrl: "https://openrouter.ai/settings/keys",
      description: "وصول للعديد من النماذج عبر API واحد",
    },
    {
      id: "groq",
      name: "Groq",
      type: "cloud",
      hasFreeTier: true,
      websiteUrl: "https://console.groq.com/keys",
      description: "استنتاج سريع للنماذج مفتوحة المصدر",
    },
    {
      id: "mistral",
      name: "Mistral",
      type: "cloud",
      hasFreeTier: true,
      websiteUrl: "https://console.mistral.ai/api-keys/",
      description: "نماذج Mistral المتقدمة",
    },
  ];

  return new Response(JSON.stringify(providers), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
