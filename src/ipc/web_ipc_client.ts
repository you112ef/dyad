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
 * Minimal web implementation to run the UI on Cloudflare Pages.
 * Data is persisted to localStorage under the `dyad:web:*` keys.
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
    let settings = this.readSettings();
    if (!settings) {
      // initialize minimal defaults
      settings = {
        selectedModel: { name: "gpt-4o-mini", provider: "openai" },
        providerSettings: {},
      } as unknown as UserSettings;
      this.writeSettings(settings);
    }
    return settings;
  }

  public async setUserSettings(
    settings: Partial<UserSettings>,
  ): Promise<UserSettings> {
    const current = (await this.getUserSettings()) || ({} as UserSettings);
    const merged = { ...current, ...settings } as UserSettings;
    this.writeSettings(merged);
    return merged;
  }

  public async getEnvVars(): Promise<Record<string, string | undefined>> {
    // No env exposure in browser
    return {};
  }

  public async getAppVersion(): Promise<string> {
    // Inject from package.json at build time if desired; fallback static
    return "web";
  }

  public async getSystemPlatform(): Promise<string> {
    return "web";
  }

  // Apps and chats
  public async listApps(): Promise<ListAppsResponse> {
    return { apps: this.readApps(), appBasePath: "" };
  }

  public async createApp(params: CreateAppParams): Promise<CreateAppResult> {
    const appId = this.nextId("app");
    const now = new Date();
    const app: App = {
      id: appId,
      name: params.name,
      path: "",
      files: [],
      createdAt: now,
      updatedAt: now,
      githubOrg: null,
      githubRepo: null,
      supabaseProjectId: null,
      supabaseProjectName: null,
    };
    const apps = this.readApps();
    apps.push(app);
    this.writeApps(apps);

    const chatId = this.nextId("chat");
    const chat: Chat = {
      id: chatId,
      title: params.name,
      messages: [],
      initialCommitHash: null,
    };
    const chats = this.readChats();
    chats.push(chat);
    this.writeChats(chats);

    return {
      app,
      chatId,
    } as CreateAppResult;
  }

  public async getApp(appId: number): Promise<App> {
    const app = this.readApps().find((a) => a.id === appId);
    if (!app) throw new Error("App not found");
    return app;
  }

  public async getChats(_appId?: number): Promise<any> {
    const chats = this.readChats();
    const filtered = chats.map((c) => ({
      id: c.id,
      appId: 0,
      title: c.title,
      createdAt: new Date(),
    }));
    return filtered as any;
  }

  public async getChat(chatId: number): Promise<Chat> {
    const chat = this.readChats().find((c) => c.id === chatId);
    if (!chat) throw new Error("Chat not found");
    return chat;
  }

  public async createChat(_appId: number): Promise<number> {
    const chatId = this.nextId("chat");
    const chat: Chat = { id: chatId, title: "New Chat", messages: [] } as any;
    const chats = this.readChats();
    chats.push(chat);
    this.writeChats(chats);
    return chatId;
  }

  // Streaming: append a placeholder assistant response after a delay
  public streamMessage(
    prompt: string,
    options: {
      chatId: number;
      redo?: boolean;
      attachments?: File[];
      onUpdate: (messages: Chat["messages"]) => void;
      onEnd: (response: ChatResponseEnd) => void;
      onError: (error: string) => void;
    },
  ): void {
    const chats = this.readChats();
    const chat = chats.find((c) => c.id === options.chatId);
    if (!chat) return options.onError("Chat not found");

    // push user message
    const userMsgId = this.nextId("message");
    chat.messages.push({ id: userMsgId, role: "user", content: prompt });
    this.writeChats(chats);
    options.onUpdate(chat.messages);

    // call serverless API for real response
    (async () => {
      try {
        const settings = await this.getUserSettings();
        const provider = settings.selectedModel?.provider || undefined;
        const model = settings.selectedModel?.name || undefined;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ prompt, provider, model }),
        });
        const assistantMsgId = this.nextId("message");
        if (!res.ok) {
          const txt = await res.text();
          chat.messages.push({ id: assistantMsgId, role: "assistant", content: `Error: ${txt}` });
        } else {
          const data = (await res.json()) as { content?: string; error?: string };
          chat.messages.push({ id: assistantMsgId, role: "assistant", content: data.content || data.error || "" });
        }
        this.writeChats(chats);
        options.onUpdate(chat.messages);
        options.onEnd({ chatId: options.chatId, updatedFiles: false });
      } catch (e: any) {
        const assistantMsgId = this.nextId("message");
        chat.messages.push({ id: assistantMsgId, role: "assistant", content: `Error: ${String(e?.message || e)}` });
        this.writeChats(chats);
        options.onUpdate(chat.messages);
        options.onEnd({ chatId: options.chatId, updatedFiles: false });
      }
    })();
  }

  public cancelChatStream(_chatId: number): void {
    // no-op in web stub
  }

  public async deleteChat(chatId: number): Promise<void> {
    const chats = this.readChats().filter((c) => c.id !== chatId);
    this.writeChats(chats);
  }

  public async deleteMessages(chatId: number): Promise<void> {
    const chats = this.readChats();
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      chat.messages = [];
      this.writeChats(chats);
    }
  }

  public async runApp(_appId: number, _onOutput: (output: AppOutput) => void) {
    // not supported in web
  }

  public async stopApp(_appId: number) {}

  public async restartApp(
    _appId: number,
    _onOutput: (output: AppOutput) => void,
    _removeNodeModules?: boolean,
  ): Promise<{ success: boolean }> {
    return { success: true };
  }

  public async listVersions(_args: { appId: number }) {
    return [];
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
    return null;
  }

  public async approveProposal(_args: {
    chatId: number;
    messageId: number;
  }) {
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
    return {
      debugInfo: await this.getSystemDebugInfo(),
      chat,
      codebase: "",
    };
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
    // Base providers available in web demo
    const base: LanguageModelProvider[] = [
      { id: "openai", name: "OpenAI", type: "cloud" } as any,
      { id: "anthropic", name: "Anthropic", type: "cloud" } as any,
      { id: "google", name: "Google", type: "cloud" } as any,
      { id: "openrouter", name: "OpenRouter", type: "cloud" } as any,
      { id: "groq", name: "Groq", type: "cloud" } as any,
      { id: "mistral", name: "Mistral", type: "cloud" } as any,
      { id: "xai", name: "xAI", type: "cloud" } as any,
      { id: "deepseek", name: "DeepSeek", type: "cloud" } as any,
    ];

    // Try to augment with providers exposed by the /api/providers endpoint (if running behind CF Pages)
    try {
      const res = await fetch("/api/providers");
      if (res.ok) {
        const apiProviders = (await res.json()) as LanguageModelProvider[];
        const map = new Map<string, any>();
        [...base, ...apiProviders].forEach((p) => map.set(p.id, p));
        return Array.from(map.values());
      }
    } catch {}

    return base;
  }

  public async getLanguageModels(_params: {
    providerId: string;
  }): Promise<LanguageModel[]> {
    const providerId = _params.providerId;
    // Fetch live models list from server-side API using env keys
    try {
      const res = await fetch(`/api/models?providerId=${encodeURIComponent(providerId)}`);
      if (res.ok) {
        const models = (await res.json()) as LanguageModel[];
        return models;
      }
    } catch {}
    return [];
  }

  public async getLanguageModelsByProviders(): Promise<
    Record<string, LanguageModel[]>
  > {
    const providers = await this.getLanguageModelProviders();
    const record: Record<string, LanguageModel[]> = {};
    for (const p of providers) {
      if (p.type === "local") continue;
      record[p.id] = await this.getLanguageModels({ providerId: p.id });
    }
    return record;
  }

  public async createCustomLanguageModelProvider(_args: {
    id: string;
    name: string;
    apiBaseUrl: string;
    envVarName?: string;
  }): Promise<LanguageModelProvider> {
    return {
      id: "custom",
      name: "Custom",
      type: "custom",
    } as any;
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

  public async checkAiRules(_params: { path: string }): Promise<{ exists: boolean }> {
    return { exists: false };
  }

  public async importApp(_params: ImportAppParams): Promise<ImportAppResult> {
    const app = await this.createApp({ name: _params.appName });
    return { appId: app.app.id, chatId: app.chatId };
  }

  public async checkAppName(_params: { appName: string }): Promise<{ exists: boolean }> {
    return { exists: false };
  }

  public async renameBranch(_params: RenameBranchParams): Promise<void> {}
}