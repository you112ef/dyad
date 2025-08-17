import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { providerSettingsRoute } from "@/routes/settings/providers/$provider";
import type { LanguageModelProvider } from "@/ipc/ipc_types";

import { useLanguageModelProviders } from "@/hooks/useLanguageModelProviders";
import { useCustomLanguageModelProvider } from "@/hooks/useCustomLanguageModelProvider";
import { GiftIcon, PlusIcon, MoreVertical, Trash2 } from "lucide-react";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertTriangle } from "lucide-react";
import { useState, useMemo } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { CreateCustomProviderDialog } from "./CreateCustomProviderDialog";
import { Button } from "@/components/ui/button";

export function ProviderSettingsGrid() {
  const navigate = useNavigate();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string>("");
  const [modelId, setModelId] = useState<string>("");
  const modelsByProvider = useMemo(
    () => ({
      openai: ["gpt-4o-mini", "gpt-4o", "gpt-4.1-mini"],
      anthropic: ["claude-3-5-sonnet-latest", "claude-3-haiku"],
      google: ["gemini-1.5-flash-latest", "gemini-1.5-pro-latest"],
      openrouter: [
        "meta-llama/llama-3.1-405b-instruct",
        "deepseek/deepseek-chat",
      ],
    }),
    [],
  );

  const {
    data: providers,
    isLoading,
    error,
    isProviderSetup,
    refetch,
  } = useLanguageModelProviders();

  const { deleteProvider, isDeleting } = useCustomLanguageModelProvider();

  const handleProviderClick = (providerId: string) => {
    navigate({
      to: providerSettingsRoute.id,
      params: { provider: providerId },
    });
  };

  const handleDeleteProvider = async () => {
    if (providerToDelete) {
      await deleteProvider(providerToDelete);
      setProviderToDelete(null);
      refetch();
    }
  };

  const handleTest = async () => {
    if (!providerId || !modelId) return;
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ providerId, prompt: `ping via ${modelId}` }),
    });
    if (!res.ok) {
      alert(`Provider test failed: ${res.status}`);
      return;
    }
    const j = await res.json();
    alert(j.text || "OK");
  };

  if (isLoading) {
    return (
      <div className="px-3 py-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          AI Providers
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="border-border">
              <CardHeader className="p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
          AI Providers
        </h2>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load AI providers: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const available = (providers || []).filter((p: any) => p.type !== "local");
  return (
    <div className="px-3 py-4 sm:p-6">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        AI Providers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {providers
          ?.filter((p) => p.type !== "local")
          .map((provider: LanguageModelProvider) => {
            const isCustom = provider.type === "custom";

            return (
              <Card
                key={provider.id}
                className="relative transition-all hover:shadow-md border-border"
              >
                <CardHeader
                  className="p-4 cursor-pointer"
                  onClick={() => handleProviderClick(provider.id)}
                >
                  <CardTitle className="text-xl flex items-center justify-between">
                    {provider.name}
                    {isProviderSetup(provider.id) ? (
                      <span className="ml-3 text-sm font-medium text-green-500 bg-green-50 dark:bg-green-900/30 border border-green-500/50 dark:border-green-500/50 px-2 py-1 rounded-full">
                        Ready
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 dark:text-gray-300 px-2 py-1 rounded-full">
                        Needs Setup
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {provider.hasFreeTier && (
                      <span className="text-blue-600 mt-2 dark:text-blue-400 text-sm font-medium bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-full inline-flex items-center">
                        <GiftIcon className="w-4 h-4 mr-1" />
                        Free tier available
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>

                {isCustom && (
                  <div
                    className="absolute top-2 right-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger className="focus:outline-none">
                        <div className="p-1 hover:bg-muted rounded-full">
                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setProviderToDelete(provider.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Provider
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </Card>
            );
          })}

        {/* Add custom provider button */}
        <Card
          className="cursor-pointer transition-all hover:shadow-md border-border border-dashed hover:border-primary/70"
          onClick={() => setIsDialogOpen(true)}
        >
          <CardHeader className="p-3 sm:p-4 flex flex-col items-center justify-center h-full">
            <PlusIcon className="h-10 w-10 text-muted-foreground mb-2" />
            <CardTitle className="text-xl text-center">
              Add custom provider
            </CardTitle>
            <CardDescription className="text-center">
              Connect to a custom LLM API endpoint
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <CreateCustomProviderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSuccess={() => {
          setIsDialogOpen(false);
          refetch();
        }}
      />

      <AlertDialog
        open={!!providerToDelete}
        onOpenChange={(open) => !open && setProviderToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Provider</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this custom provider and all its
              associated models. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProvider}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Provider"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-4 space-y-4">
        <h2 className="text-xl font-bold">AI Providers</h2>
        <div className="grid grid-cols-1 gap-4">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Connect Provider</CardTitle>
              <CardDescription>
                اختر المزود والموديل. إذا كانت مفاتيح البيئة مضبوطة على Pages
                سيعمل فورًا.
              </CardDescription>
              <div className="flex flex-col sm:flex-row gap-3 mt-3">
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={providerId}
                  onChange={(e) => {
                    setProviderId(e.target.value);
                    setModelId("");
                  }}
                >
                  <option value="">اختر المزود…</option>
                  {available.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded px-3 py-2 text-sm"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  disabled={!providerId}
                >
                  <option value="">اختر الموديل…</option>
                  {(
                    (providerId && (modelsByProvider as any)[providerId]) ||
                    []
                  ).map((m: string) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <Button onClick={handleTest} disabled={!providerId || !modelId}>
                  اختبار الاتصال
                </Button>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
