export const onRequest: PagesFunction = async ({ env }) => {
  // Map of provider -> environment variable name used for API key
  const PROVIDER_TO_ENV_VAR: Record<string, string> = {
    openai: "OPENAI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    google: "GEMINI_API_KEY",
    openrouter: "OPENROUTER_API_KEY",
    groq: "GROQ_API_KEY",
    mistral: "MISTRAL_API_KEY",
    xai: "XAI_API_KEY",
    deepseek: "DEEPSEEK_API_KEY",
  };

  // Cloud provider metadata to match the application's expectations
  const CLOUD_PROVIDERS: Record<
    string,
    {
      displayName: string;
      hasFreeTier?: boolean;
      websiteUrl?: string;
      // gatewayPrefix is part of the desktop app, not required here
    }
  > = {
    openai: {
      displayName: "OpenAI",
      hasFreeTier: false,
      websiteUrl: "https://platform.openai.com/api-keys",
    },
    anthropic: {
      displayName: "Anthropic",
      hasFreeTier: false,
      websiteUrl: "https://console.anthropic.com/settings/keys",
    },
    google: {
      displayName: "Google",
      hasFreeTier: true,
      websiteUrl: "https://aistudio.google.com/app/apikey",
    },
    openrouter: {
      displayName: "OpenRouter",
      hasFreeTier: true,
      websiteUrl: "https://openrouter.ai/settings/keys",
    },
    groq: {
      displayName: "Groq",
      hasFreeTier: true,
      websiteUrl: "https://console.groq.com/keys",
    },
    mistral: {
      displayName: "Mistral",
      hasFreeTier: true,
      websiteUrl: "https://console.mistral.ai/api-keys/",
    },
    xai: {
      displayName: "xAI",
      hasFreeTier: false,
      websiteUrl: "https://console.x.ai/",
    },
    deepseek: {
      displayName: "DeepSeek",
      hasFreeTier: true,
      websiteUrl: "https://platform.deepseek.com/",
    },
  };

  // Build provider list, including only those with env keys present in this Pages env
  const providers: any[] = [];
  for (const providerId of Object.keys(CLOUD_PROVIDERS)) {
    const envVarName = PROVIDER_TO_ENV_VAR[providerId];
    const apiKey = envVarName ? (env as any)[envVarName] : undefined;

    // If the key is present in the Cloudflare env, surface this provider to the web client
    if (apiKey) {
      const meta = CLOUD_PROVIDERS[providerId];
      providers.push({
        id: providerId,
        name: meta.displayName,
        hasFreeTier: meta.hasFreeTier,
        websiteUrl: meta.websiteUrl,
        envVarName,
        type: "cloud",
      });
    }
  }

  return new Response(JSON.stringify(providers), {
    headers: { "content-type": "application/json" },
  });
};