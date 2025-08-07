import { useQuery } from "@tanstack/react-query";
import { IpcClient } from "@/ipc/ipc_client";
import type { LanguageModelProvider } from "@/ipc/ipc_types";
import { useSettings } from "./useSettings";
import { cloudProviders } from "@/lib/schemas";

export function useLanguageModelProviders() {
  const ipcClient = IpcClient.getInstance();
  const { settings, envVars } = useSettings();

  const queryResult = useQuery<LanguageModelProvider[], Error>({
    queryKey: ["languageModelProviders"],
    queryFn: async () => {
      // Try local IPC first
      let base = await ipcClient.getLanguageModelProviders();
      // Merge in local providers explicitly
      const local: LanguageModelProvider[] = [
        { id: "ollama", name: "Ollama (Local)", type: "local" } as any,
        { id: "lmstudio", name: "LM Studio (Local)", type: "local" } as any,
      ];
      // Try API (Cloudflare Pages function) to reveal cloud providers via env
      try {
        const res = await fetch("/api/providers");
        if (res.ok) {
          const apiProviders = (await res.json()) as LanguageModelProvider[];
          // Merge unique by id
          const map = new Map<string, LanguageModelProvider>();
          [...base, ...local, ...apiProviders].forEach((p) => map.set(p.id, p));
          return Array.from(map.values());
        }
      } catch {}
      return [...base, ...local];
    },
  });

  const isProviderSetup = (provider: string) => {
    const providerSettings = settings?.providerSettings[provider];
    if (queryResult.isLoading) {
      return false;
    }
    if (providerSettings?.apiKey?.value) {
      return true;
    }
    const providerData = queryResult.data?.find((p) => p.id === provider);
    if ((providerData as any)?.envVarName && envVars[(providerData as any).envVarName]) {
      return true;
    }
    return false;
  };

  const isAnyProviderSetup = () => {
    return cloudProviders.some((provider) => isProviderSetup(provider));
  };

  return {
    ...queryResult,
    isProviderSetup,
    isAnyProviderSetup,
  };
}
