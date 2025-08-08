import { db } from "@/db";
import {
  language_model_providers as languageModelProvidersSchema,
  language_models as languageModelsSchema,
} from "@/db/schema";
import type { LanguageModelProvider, LanguageModel } from "@/ipc/ipc_types";
import { eq } from "drizzle-orm";

export interface ModelOption {
  name: string;
  displayName: string;
  description: string;
  tag?: string;
  maxOutputTokens?: number;
  contextWindow?: number;
  supportsTurboEdits?: boolean;
}

export const MODEL_OPTIONS: Record<string, ModelOption[]> = {
  openai: [
    // https://platform.openai.com/docs/models/gpt-4.1
    {
      name: "gpt-4.1",
      displayName: "GPT 4.1",
      description: "OpenAI's flagship model",
      maxOutputTokens: 32_768,
      contextWindow: 1_047_576,
      supportsTurboEdits: true,
      tag: "General",
    },
    // https://platform.openai.com/docs/models/gpt-4.1-mini
    {
      name: "gpt-4.1-mini",
      displayName: "GPT 4.1 Mini",
      description: "OpenAI's lightweight, but intelligent model",
      maxOutputTokens: 32_768,
      contextWindow: 1_047_576,
      tag: "Mini",
    },
    // omni
    {
      name: "gpt-4o",
      displayName: "GPT-4o (Omni)",
      description: "Multimodal, fast, and capable",
      contextWindow: 128_000,
      tag: "Omni",
    },
    {
      name: "gpt-4o-mini",
      displayName: "GPT-4o Mini",
      description: "Budget-friendly Omni",
      contextWindow: 128_000,
      tag: "Omni/Mini",
    },
    // https://platform.openai.com/docs/models/o3-mini
    {
      name: "o3-mini",
      displayName: "o3 mini",
      description: "Reasoning model",
      maxOutputTokens: 100_000,
      contextWindow: 200_000,
      tag: "Reasoning",
    },
  ],
  // https://docs.anthropic.com/en/docs/about-claude/models/all-models#model-comparison-table
  anthropic: [
    {
      name: "claude-3-7-sonnet-latest",
      displayName: "Claude 3.7 Sonnet",
      description: "Excellent coder",
      maxOutputTokens: 64_000,
      contextWindow: 200_000,
      supportsTurboEdits: true,
      tag: "General",
    },
    {
      name: "claude-3-5-sonnet-20241022",
      displayName: "Claude 3.5 Sonnet",
      description: "Good coder, excellent at following instructions",
      maxOutputTokens: 8_000,
      contextWindow: 200_000,
      supportsTurboEdits: true,
      tag: "General",
    },
    {
      name: "claude-3-5-haiku-20241022",
      displayName: "Claude 3.5 Haiku",
      description: "Lightweight coder",
      maxOutputTokens: 8_000,
      contextWindow: 200_000,
      tag: "Mini",
    },
  ],
  google: [
    // https://ai.google.dev/gemini-api/docs/models#gemini-2.5-pro-preview-03-25
    {
      name: "gemini-2.5-pro-preview-05-06",
      displayName: "Gemini 2.5 Pro",
      description: "Preview version of Google's Gemini 2.5 Pro model",
      // See Flash 2.5 comment below (go 1 below just to be safe, even though it seems OK now).
      maxOutputTokens: 65_536 - 1,
      // Gemini context window = input token + output token
      contextWindow: 1_048_576,
      supportsTurboEdits: true,
      tag: "Pro",
    },
    // https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash-preview
    {
      name: "gemini-2.5-flash-preview-04-17",
      displayName: "Gemini 2.5 Flash",
      description:
        "Preview version of Google's Gemini 2.5 Flash model (free tier available)",
      // Weirdly for Vertex AI, the output token limit is *exclusive* of the stated limit.
      maxOutputTokens: 65_536 - 1,
      // Gemini context window = input token + output token
      contextWindow: 1_048_576,
      tag: "Flash",
    },
  ],
  openrouter: [
    {
      name: "deepseek/deepseek-chat-v3-0324",
      displayName: "DeepSeek v3",
      description: "DeepSeek Chat v3",
      maxOutputTokens: 32_000,
      contextWindow: 128_000,
      tag: "General",
    },
    {
      name: "deepseek/deepseek-r1",
      displayName: "DeepSeek R1",
      description: "DeepSeek Reasoning",
      contextWindow: 128_000,
      tag: "Reasoning",
    },
    {
      name: "qwen/qwen-2.5-coder-32b-instruct",
      displayName: "Qwen 2.5 Coder 32B",
      description: "Coding-focused model",
      contextWindow: 128_000,
      tag: "Coding",
    },
  ],
  groq: [
    {
      name: "llama-3.1-70b-versatile",
      displayName: "Llama 3.1 70B (Groq)",
      description: "Fast inference on Groq hardware",
      contextWindow: 128_000,
      tag: "General",
    },
    {
      name: "llama-3.1-8b-instant",
      displayName: "Llama 3.1 8B (Groq)",
      description: "Lower cost, fast responses",
      contextWindow: 128_000,
      tag: "Mini",
    },
    {
      name: "mixtral-8x7b-32768",
      displayName: "Mixtral 8x7B 32k (Groq)",
      description: "Mixture of Experts with 32k context",
      contextWindow: 32_768,
      tag: "General",
    },
    {
      name: "gemma2-9b-it",
      displayName: "Gemma 2 9B (Groq)",
      description: "Efficient instruction-tuned",
      contextWindow: 32_768,
      tag: "Mini",
    },
  ],
  mistral: [
    {
      name: "mistral-large-latest",
      displayName: "Mistral Large",
      description: "General purpose model by Mistral",
      contextWindow: 128_000,
      supportsTurboEdits: true,
      tag: "General",
    },
    {
      name: "mistral-small-latest",
      displayName: "Mistral Small",
      description: "Lightweight and efficient",
      contextWindow: 32_000,
      tag: "Mini",
    },
    {
      name: "codestral-latest",
      displayName: "Codestral",
      description: "Mistral's code generation model",
      contextWindow: 32_000,
      tag: "Coding",
    },
    {
      name: "ministral-8b-latest",
      displayName: "Ministral 8B",
      description: "Compact, capable",
      contextWindow: 32_000,
      tag: "Mini",
    },
  ],
  xai: [
    {
      name: "grok-2-latest",
      displayName: "Grok 2",
      description: "xAI's latest Grok model",
      contextWindow: 128_000,
      supportsTurboEdits: true,
      tag: "General",
    },
    {
      name: "grok-2-mini",
      displayName: "Grok 2 Mini",
      description: "Faster, budget-friendly Grok variant",
      contextWindow: 64_000,
      tag: "Mini",
    },
  ],
  deepseek: [
    {
      name: "deepseek-chat",
      displayName: "DeepSeek Chat",
      description: "General chat model",
      contextWindow: 128_000,
      tag: "General",
    },
    {
      name: "deepseek-reasoner",
      displayName: "DeepSeek Reasoner",
      description: "Reasoning-focused model",
      contextWindow: 128_000,
      tag: "Reasoning",
    },
    {
      name: "deepseek-coder",
      displayName: "DeepSeek Coder",
      description: "Code-oriented model",
      contextWindow: 128_000,
      tag: "Coding",
    },
  ],
  auto: [
    {
      name: "auto",
      displayName: "Auto",
      description: "Automatically selects the best model",
      tag: "Default",
    },
  ],
};

export const PROVIDER_TO_ENV_VAR: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
  google: "GEMINI_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
  groq: "GROQ_API_KEY",
  mistral: "MISTRAL_API_KEY",
  xai: "XAI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
};

export const CLOUD_PROVIDERS: Record<
  string,
  {
    displayName: string;
    hasFreeTier?: boolean;
    websiteUrl?: string;
    gatewayPrefix: string;
    apiBaseUrl?: string;
  }
> = {
  openai: {
    displayName: "OpenAI",
    hasFreeTier: false,
    websiteUrl: "https://platform.openai.com/api-keys",
    gatewayPrefix: "",
  },
  anthropic: {
    displayName: "Anthropic",
    hasFreeTier: false,
    websiteUrl: "https://console.anthropic.com/settings/keys",
    gatewayPrefix: "anthropic/",
  },
  google: {
    displayName: "Google",
    hasFreeTier: true,
    websiteUrl: "https://aistudio.google.com/app/apikey",
    gatewayPrefix: "gemini/",
  },
  openrouter: {
    displayName: "OpenRouter",
    hasFreeTier: true,
    websiteUrl: "https://openrouter.ai/settings/keys",
    gatewayPrefix: "openrouter/",
  },
  groq: {
    displayName: "Groq",
    hasFreeTier: true,
    websiteUrl: "https://console.groq.com/keys",
    gatewayPrefix: "groq/",
  },
  mistral: {
    displayName: "Mistral",
    hasFreeTier: true,
    websiteUrl: "https://console.mistral.ai/api-keys/",
    gatewayPrefix: "mistral/",
  },
  xai: {
    displayName: "xAI",
    hasFreeTier: false,
    websiteUrl: "https://console.x.ai/",
    gatewayPrefix: "xai/",
  },
  deepseek: {
    displayName: "DeepSeek",
    hasFreeTier: true,
    websiteUrl: "https://platform.deepseek.com/",
    gatewayPrefix: "deepseek/",
  },
  auto: {
    displayName: "Dyad",
    websiteUrl: "https://academy.dyad.sh/settings",
    gatewayPrefix: "",
  },
};

const LOCAL_PROVIDERS: Record<
  string,
  {
    displayName: string;
    hasFreeTier: boolean;
  }
> = {
  ollama: {
    displayName: "Ollama",
    hasFreeTier: true,
  },
  lmstudio: {
    displayName: "LM Studio",
    hasFreeTier: true,
  },
};

/**
 * Fetches language model providers from both the database (custom) and hardcoded constants (cloud),
 * merging them with custom providers taking precedence.
 * @returns A promise that resolves to an array of LanguageModelProvider objects.
 */
export async function getLanguageModelProviders(): Promise<
  LanguageModelProvider[]
> {
  // Fetch custom providers from the database
  const customProvidersDb = await db
    .select()
    .from(languageModelProvidersSchema);

  const customProvidersMap = new Map<string, LanguageModelProvider>();
  for (const cp of customProvidersDb) {
    customProvidersMap.set(cp.id, {
      id: cp.id,
      name: cp.name,
      apiBaseUrl: cp.api_base_url,
      envVarName: cp.env_var_name ?? undefined,
      type: "custom",
      // hasFreeTier, websiteUrl, gatewayPrefix are not in the custom DB schema
      // They will be undefined unless overridden by hardcoded values if IDs match
    });
  }

  // Get hardcoded cloud providers
  const hardcodedProviders: LanguageModelProvider[] = [];
  for (const providerKey in CLOUD_PROVIDERS) {
    if (Object.prototype.hasOwnProperty.call(CLOUD_PROVIDERS, providerKey)) {
      // Ensure providerKey is a key of PROVIDERS
      const key = providerKey as keyof typeof CLOUD_PROVIDERS;
      const providerDetails = CLOUD_PROVIDERS[key];
      if (providerDetails) {
        // Ensure providerDetails is not undefined
        hardcodedProviders.push({
          id: key,
          name: providerDetails.displayName,
          hasFreeTier: providerDetails.hasFreeTier,
          websiteUrl: providerDetails.websiteUrl,
          gatewayPrefix: providerDetails.gatewayPrefix,
          envVarName: PROVIDER_TO_ENV_VAR[key] ?? undefined,
          type: "cloud",
          // apiBaseUrl is not directly in PROVIDERS
        });
      }
    }
  }

  for (const providerKey in LOCAL_PROVIDERS) {
    if (Object.prototype.hasOwnProperty.call(LOCAL_PROVIDERS, providerKey)) {
      const key = providerKey as keyof typeof LOCAL_PROVIDERS;
      const providerDetails = LOCAL_PROVIDERS[key];
      hardcodedProviders.push({
        id: key,
        name: providerDetails.displayName,
        hasFreeTier: providerDetails.hasFreeTier,
        type: "local",
      });
    }
  }

  return [...hardcodedProviders, ...customProvidersMap.values()];
}

/**
 * Fetches language models for a specific provider.
 * @param obj An object containing the providerId.
 * @returns A promise that resolves to an array of LanguageModel objects.
 */
export async function getLanguageModels({
  providerId,
}: {
  providerId: string;
}): Promise<LanguageModel[]> {
  const allProviders = await getLanguageModelProviders();
  const provider = allProviders.find((p) => p.id === providerId);

  if (!provider) {
    console.warn(`Provider with ID "${providerId}" not found.`);
    return [];
  }

  // Get custom models from DB for all provider types
  let customModels: LanguageModel[] = [];

  try {
    const customModelsDb = await db
      .select({
        id: languageModelsSchema.id,
        displayName: languageModelsSchema.displayName,
        apiName: languageModelsSchema.apiName,
        description: languageModelsSchema.description,
        maxOutputTokens: languageModelsSchema.max_output_tokens,
        contextWindow: languageModelsSchema.context_window,
      })
      .from(languageModelsSchema)
      .where(
        isCustomProvider({ providerId })
          ? eq(languageModelsSchema.customProviderId, providerId)
          : eq(languageModelsSchema.builtinProviderId, providerId),
      );

    customModels = customModelsDb.map((model) => ({
      ...model,
      description: model.description ?? "",
      tag: undefined,
      maxOutputTokens: model.maxOutputTokens ?? undefined,
      contextWindow: model.contextWindow ?? undefined,
      type: "custom",
    }));
  } catch (error) {
    console.error(
      `Error fetching custom models for provider "${providerId}" from DB:`,
      error,
    );
    // Continue with empty custom models array
  }

  // If it's a cloud provider, also get the hardcoded models
  let hardcodedModels: LanguageModel[] = [];
  if (provider.type === "cloud") {
    if (providerId in MODEL_OPTIONS) {
      const models = MODEL_OPTIONS[providerId] || [];
      hardcodedModels = models.map((model) => ({
        ...model,
        apiName: model.name,
        type: "cloud",
      }));
    } else {
      // For new providers without hardcoded model options, return empty list (custom models can be added)
    }
  }

  return [...hardcodedModels, ...customModels];
}

/**
 * Fetches all language models grouped by their provider IDs.
 * @returns A promise that resolves to a Record mapping provider IDs to arrays of LanguageModel objects.
 */
export async function getLanguageModelsByProviders(): Promise<
  Record<string, LanguageModel[]>
> {
  const providers = await getLanguageModelProviders();

  // Fetch all models concurrently
  const modelPromises = providers
    .filter((p) => p.type !== "local")
    .map(async (provider) => {
      const models = await getLanguageModels({ providerId: provider.id });
      return { providerId: provider.id, models };
    });

  // Wait for all requests to complete
  const results = await Promise.all(modelPromises);

  // Convert the array of results to a record
  const record: Record<string, LanguageModel[]> = {};
  for (const result of results) {
    record[result.providerId] = result.models;
  }

  return record;
}

export function isCustomProvider({ providerId }: { providerId: string }) {
  return providerId.startsWith(CUSTOM_PROVIDER_PREFIX);
}

export const CUSTOM_PROVIDER_PREFIX = "custom::";
