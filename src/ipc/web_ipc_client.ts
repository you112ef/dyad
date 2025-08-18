import type {
  App,
  AppOutput,
  BranchResult,
  Chat,
  ChatLogsData,
  ChatResponseEnd,
  CreateAppParams,
  CreateAppResult,
  DoesReleaseNoteExistParams,
  ImportAppParams,
  ImportAppResult,
  LanguageModel,
  LanguageModelProvider,
  ListAppsResponse,
  NodeSystemInfo,
  RenameBranchParams,
  TokenCountParams,
  TokenCountResult,
} from "./ipc_types";
import type { UserSettings } from "@/lib/schemas";

/**
 * Web implementation used on Cloudflare Pages. Persists to localStorage,
 * calls Pages Functions for chat/providers/models/settings.
 */
export class WebIpcClient {
  private static STORAGE_KEYS = {
    apps: "dyad:web:apps",
    chats: "dyad:web:chats",
    settings: "dyad:web:settings",
    ids: "dyad:web:ids",
  } as const;

  private ensureIds() {
    const ids = this.readLocal<{ app: number; chat: number; message: number }>(
      WebIpcClient.STORAGE_KEYS.ids,
    );
    if (!ids) {
      this.writeLocal(WebIpcClient.STORAGE_KEYS.ids, {
        app: 1,
        chat: 1,
        message: 1,
      });
    }
  }

  private nextId(type: keyof { app: number; chat: number; message: number }) {
    this.ensureIds();
    const ids = this.readLocal<any>(WebIpcClient.STORAGE_KEYS.ids)!;
    const id = ids[type] as number;
    ids[type] = id + 1;
    this.writeLocal(WebIpcClient.STORAGE_KEYS.ids, ids);
    return id;
  }

  private readLocal<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  private writeLocal<T>(key: string, value: T) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private readApps(): App[] {
    return this.readLocal<App[]>(WebIpcClient.STORAGE_KEYS.apps) ?? [];
  }
  private writeApps(apps: App[]) {
    this.writeLocal(WebIpcClient.STORAGE_KEYS.apps, apps);
  }

  private readChats(): Chat[] {
    return this.readLocal<Chat[]>(WebIpcClient.STORAGE_KEYS.chats) ?? [];
  }

  private writeChats(chats: Chat[]) {
    this.writeLocal(WebIpcClient.STORAGE_KEYS.chats, chats);
  }

  private readSettings(): UserSettings | null {
    return this.readLocal<UserSettings>(WebIpcClient.STORAGE_KEYS.settings);
  }

  private writeSettings(settings: UserSettings) {
    this.writeLocal<WebIpcClient>(
      WebIpcClient.STORAGE_KEYS.settings,
      settings as any,
    );
  }

  // Settings and environment
  public async getUserSettings(): Promise<UserSettings> {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const server = (await res.json()) as UserSettings;
        this.writeSettings(server);
        return server;
      }
    } catch {}
    let local = this.readSettings();
    if (!local) {
      local = {
        selectedModel: { name: "gpt-4o-mini", provider: "openai" },
        providerSettings: {},
      } as unknown as UserSettings;
      this.writeSettings(local);
    }
    return local;
  }

  public async setUserSettings(
    settings: Partial<UserSettings>,
  ): Promise<UserSettings> {
    const current = (await this.getUserSettings()) || ({} as UserSettings);
    const merged = { ...current, ...settings } as UserSettings;
    this.writeSettings(merged);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        body: JSON.stringify(merged),
      });
      if (res.ok) return (await res.json()) as UserSettings;
    } catch {}
    return merged;
  }

  public async getEnvVars(): Promise<Record<string, string | undefined>> {
    // No env exposure in browser
    return {};
  }

  public async getAppVersion(): Promise<string> {
    return "web";
  }

  public async getSystemPlatform(): Promise<string> {
    return "web";
  }

  // Apps and chats
  public async listApps(): Promise<ListAppsResponse> {
    try {
      const r = await fetch("/api/apps");
      if (r.ok) {
        const apps = await r.json();
        return { apps, appBasePath: "" } as any;
      }
    } catch {}
    return { apps: this.readApps(), appBasePath: "" };
  }

  public async createApp(params: CreateAppParams): Promise<CreateAppResult> {
    try {
      const r = await fetch("/api/apps", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: params.name }),
      });
      if (r.ok) return (await r.json()) as CreateAppResult;
    } catch {}
    // fallback local
    const appId = this.nextId("app");
    const now = new Date();
    const app: App = {
      id: appId,
      name: params.name,
      path: "",
      files: [],
      createdAt: now,
      updatedAt: now,
    } as any;
    const apps = this.readApps();
    apps.push(app);
    this.writeApps(apps);
    const chatId = this.nextId("chat");
    const chat: Chat = { id: chatId, title: params.name, messages: [] } as any;
    const chats = this.readChats();
    chats.push(chat);
    this.writeChats(chats);
    return { app, chatId } as any;
  }

  public async getApp(appId: number): Promise<App> {
    try {
      const [appRes, filesRes] = await Promise.all([
        fetch(`/api/apps?id=${appId}`),
        fetch(`/api/files?appId=${appId}&list=1`),
      ]);
      const appRow = appRes.ok ? await appRes.json() : null;
      const files = filesRes.ok ? await filesRes.json() : [];
      if (appRow) {
        return {
          id: appRow.id,
          name: appRow.name,
          path: "",
          files,
          createdAt: new Date(appRow.createdAt),
          updatedAt: new Date(appRow.updatedAt),
        } as any;
      }
    } catch {}
    const app = this.readApps().find((a) => a.id === appId);
    if (!app) throw new Error("App not found");
    return app;
  }

  public async getChats(appId?: number): Promise<any> {
    if (appId) {
      try {
        const r = await fetch(`/api/chats?appId=${appId}`);
        if (r.ok) return await r.json();
      } catch {}
    }
    const chats = this.readChats();
    return chats.map((c) => ({
      id: c.id,
      appId: appId ?? 0,
      title: c.title,
      createdAt: new Date(),
    })) as any;
  }

  public async getChat(chatId: number): Promise<Chat> {
    try {
      const msgs = await (await fetch(`/api/messages?chatId=${chatId}`)).json();
      return { id: chatId, title: "Chat", messages: msgs } as any;
    } catch {}
    const chat = this.readChats().find((c) => c.id === chatId);
    if (!chat) throw new Error("Chat not found");
    return chat;
  }

  public async createChat(appId: number): Promise<number> {
    try {
      const r = await fetch(`/api/chats`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ appId, title: "New Chat" }),
      });
      if (r.ok) return (await r.json()).id as number;
    } catch {}
    const chatId = this.nextId("chat");
    const chats = this.readChats();
    chats.push({ id: chatId, title: "New Chat", messages: [] } as any);
    this.writeChats(chats);
    return chatId;
  }

  // Streaming via Pages function with fallback
  public async streamMessage(
    prompt: string,
    options: {
      chatId: number;
      redo?: boolean;
      attachments?: File[];
      onUpdate: (messages: Chat["messages"]) => void;
      onEnd: (response: ChatResponseEnd) => void;
      onError: (error: string) => void;
    },
  ): Promise<void> {
    const chats = this.readChats();
    const chat = chats.find((c) => c.id === options.chatId);
    if (!chat) return options.onError("Chat not found");

    const userMsgId = this.nextId("message");
    chat.messages.push({ id: userMsgId, role: "user", content: prompt });
    this.writeChats(chats);
    options.onUpdate(chat.messages);

    try {
      const settings = await this.getUserSettings();
      const provider = settings.selectedModel?.provider || "openai";
      const model = settings.selectedModel?.name || "gpt-4o-mini";

      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, model, messages: chat.messages }),
      });
      if (!resp.ok || !resp.body) {
        throw new Error(`Chat API error: ${resp.status}`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();

      const assistantMsgId = this.nextId("message");
      chat.messages.push({
        id: assistantMsgId,
        role: "assistant",
        content: "",
      });
      this.writeChats(chats);
      options.onUpdate(chat.messages);

      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        if (buffer.includes("data:")) {
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
              if (token) {
                const last = chat.messages[chat.messages.length - 1];
                if (last && last.role === "assistant") last.content += token;
                this.writeChats(chats);
                options.onUpdate(chat.messages);
              }
            } catch {
              // ignore
            }
          }
        } else {
          const last = chat.messages[chat.messages.length - 1];
          if (last && last.role === "assistant") last.content += buffer;
          buffer = "";
          this.writeChats(chats);
          options.onUpdate(chat.messages);
        }
      }
      options.onEnd({ chatId: options.chatId, updatedFiles: false });
    } catch (err) {
      const assistantMsgId = this.nextId("message");
      const assistantText =
        "This is a web demo running on Cloudflare Pages. Configure providers in Settings to enable real responses.";
      chat.messages.push({
        id: assistantMsgId,
        role: "assistant",
        content: assistantText,
      });
      this.writeChats(chats);
      options.onUpdate(chat.messages);
      if (err instanceof Error) options.onError(err.message);
      options.onEnd({ chatId: options.chatId, updatedFiles: false });
    }
  }

  public cancelChatStream(_chatId: number): void {}

  public async deleteChat(chatId: number): Promise<void> {
    try {
      await fetch(`/api/chats?id=${chatId}`, { method: "DELETE" });
    } catch {}
    const chats = this.readChats().filter((c) => c.id !== chatId);
    this.writeChats(chats);
  }

  public async deleteMessages(chatId: number): Promise<void> {
    try {
      await fetch(`/api/messages?chatId=${chatId}`, { method: "DELETE" });
    } catch {}
    const chats = this.readChats();
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      chat.messages = [];
      this.writeChats(chats);
    }
  }

  public async runApp(_appId: number, _onOutput: (output: AppOutput) => void) {}
  public async stopApp(_appId: number): Promise<void> {}
  public async restartApp(
    _appId: number,
    _onOutput: (output: AppOutput) => void,
    _removeNodeModules?: boolean,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }

  public async listVersions(_args: { appId: number }) {
    return [] as any[];
  }
  public async revertVersion(_args: {
    appId: number;
    previousVersionId: string;
  }): Promise<void> {}
  public async checkoutVersion(_args: {
    appId: number;
    versionId: string;
  }): Promise<void> {}

  public async getCurrentBranch(_appId: number): Promise<BranchResult> {
    return { branch: "main" };
  }

  public async deleteApp(appId: number): Promise<void> {
    this.writeApps(this.readApps().filter((a) => a.id !== appId));
  }

  public async renameApp(_args: {
    appId: number;
    appName: string;
    appPath: string;
  }): Promise<void> {}

  public async resetAll(): Promise<void> {
    localStorage.removeItem(WebIpcClient.STORAGE_KEYS.apps);
    localStorage.removeItem(WebIpcClient.STORAGE_KEYS.chats);
    localStorage.removeItem(WebIpcClient.STORAGE_KEYS.settings);
    localStorage.removeItem(WebIpcClient.STORAGE_KEYS.ids);
  }

  public async addDependency(_args: {
    chatId: number;
    packages: string[];
  }): Promise<void> {}

  public async getNodejsStatus(): Promise<NodeSystemInfo> {
    return { nodeVersion: null, pnpmVersion: null, nodeDownloadUrl: "" };
  }

  // GitHub device flow no-ops
  public startGithubDeviceFlow(_appId: number | null): void {}
  public onGithubDeviceFlowUpdate(_cb: any): () => void {
    return () => {};
  }
  public onGithubDeviceFlowSuccess(_cb: any): () => void {
    return () => {};
  }
  public onGithubDeviceFlowError(_cb: any): () => void {
    return () => {};
  }

  public async checkGithubRepoAvailable(
    _org: string,
    _repo: string,
  ): Promise<{ available: boolean; error?: string }> {
    return { available: false, error: "Not supported on web" };
  }
  public async createGithubRepo(
    _org: string,
    _repo: string,
    _appId: number,
  ): Promise<void> {}
  public async syncGithubRepo(
    _appId: number,
  ): Promise<{ success: boolean; error?: string }> {
    return { success: false, error: "Not supported on web" };
  }
  public async disconnectGithubRepo(_appId: number): Promise<void> {}

  public async getAppVersionWeb(): Promise<string> {
    return "web";
  }

  public async getProposal(_chatId: number) {
    return null as any;
  }
  public async approveProposal(_args: { chatId: number; messageId: number }) {
    return {} as any;
  }
  public async rejectProposal(_args: { chatId: number; messageId: number }) {}

  public async listSupabaseProjects(): Promise<any[]> {
    return [];
  }
  public async setSupabaseAppProject(
    _project: string,
    _app: number,
  ): Promise<void> {}
  public async unsetSupabaseAppProject(_app: number): Promise<void> {}

  public async getSystemDebugInfo() {
    return {
      nodeVersion: null,
      pnpmVersion: null,
      nodePath: null,
      telemetryId: "",
      telemetryConsent: "unset",
      telemetryUrl: "",
      dyadVersion: "web",
      platform: "web",
      architecture: "",
      logs: "",
    } as ChatLogsData["debugInfo"];
  }

  public async getChatLogs(_chatId: number): Promise<ChatLogsData> {
    const chat = await this.getChat(_chatId);
    return { debugInfo: await this.getSystemDebugInfo(), chat, codebase: "" };
  }

  public async uploadToSignedUrl(
    _url: string,
    _contentType: string,
    _data: any,
  ): Promise<void> {}
  public async listLocalOllamaModels() {
    return [];
  }
  public async listLocalLMStudioModels() {
    return [];
  }

  public onDeepLinkReceived(
    _callback: (data: { type: string; url?: string }) => void,
  ) {
    return () => {};
  }

  public async countTokens(
    _params: TokenCountParams,
  ): Promise<TokenCountResult> {
    return {
      totalTokens: 0,
      messageHistoryTokens: 0,
      codebaseTokens: 0,
      inputTokens: 0,
      systemPromptTokens: 0,
      contextWindow: 0,
    };
  }

  public async minimizeWindow(): Promise<void> {}
  public async maximizeWindow(): Promise<void> {}
  public async closeWindow(): Promise<void> {}

  public async doesReleaseNoteExist(
    _params: DoesReleaseNoteExistParams,
  ): Promise<{ exists: boolean; url?: string }> {
    return { exists: false };
  }

  public async getLanguageModelProviders(): Promise<LanguageModelProvider[]> {
    const base = [
      { id: "openai", name: "OpenAI", type: "cloud" },
      { id: "anthropic", name: "Anthropic", type: "cloud" },
      { id: "google", name: "Google", type: "cloud" },
      { id: "openrouter", name: "OpenRouter", type: "cloud" },
    ] as any;
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const apiProviders = await res.json();
        const map = new Map<string, any>();
        [...base, ...apiProviders].forEach((p: any) => map.set(p.id, p));
        return Array.from(map.values());
      }
    } catch {}
    return base as any;
  }

  public async getLanguageModels(params: {
    providerId: string;
  }): Promise<LanguageModel[]> {
    const res = await fetch(
      `/api/models?provider=${encodeURIComponent(params.providerId)}`,
    );
    if (!res.ok) return [];
    const models = (await res.json()) as string[];
    return models.map((name) => ({
      id: name,
      apiName: name,
      displayName: name,
    })) as any;
  }

  public async getLanguageModelsByProviders(): Promise<
    Record<string, LanguageModel[]>
  > {
    const providers = await this.getLanguageModelProviders();
    const entries = await Promise.all(
      providers
        .filter((p) => (p as any).type !== "local")
        .map(
          async (p) =>
            [p.id, await this.getLanguageModels({ providerId: p.id })] as const,
        ),
    );
    return Object.fromEntries(entries);
  }

  public async createCustomLanguageModelProvider(_args: {
    id: string;
    name: string;
    apiBaseUrl: string;
    envVarName?: string;
  }): Promise<LanguageModelProvider> {
    return { id: "custom", name: "Custom", type: "custom" } as any;
  }
  public async createCustomLanguageModel(_params: any): Promise<void> {}
  public async deleteCustomLanguageModel(_modelId: string): Promise<void> {}
  public async deleteCustomModel(_params: {
    providerId: string;
    modelApiName: string;
  }): Promise<void> {}
  public async deleteCustomLanguageModelProvider(
    _providerId: string,
  ): Promise<void> {}

  public async selectAppFolder(): Promise<{
    path: string | null;
    name: string | null;
  }> {
    return { path: null, name: null };
  }
  public async checkAiRules(_params: {
    path: string;
  }): Promise<{ exists: boolean }> {
    return { exists: false };
  }
  public async importApp(_params: ImportAppParams): Promise<ImportAppResult> {
    const app = await this.createApp({ name: _params.appName });
    return { appId: app.app.id, chatId: app.chatId };
  }
  public async checkAppName(_params: {
    appName: string;
  }): Promise<{ exists: boolean }> {
    return { exists: false };
  }
  public async renameBranch(_params: RenameBranchParams): Promise<void> {}
}
