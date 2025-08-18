import type { IpcRenderer } from "electron";
import {
  type ChatSummary,
  ChatSummariesSchema,
  type UserSettings,
} from "../lib/schemas";
import type {
  App,
  AppOutput,
  Chat,
  ChatResponseEnd,
  CreateAppParams,
  CreateAppResult,
  ListAppsResponse,
  NodeSystemInfo,
  Message,
  Version,
  SystemDebugInfo,
  LocalModel,
  TokenCountParams,
  TokenCountResult,
  ChatLogsData,
  BranchResult,
  LanguageModelProvider,
  LanguageModel,
  CreateCustomLanguageModelProviderParams,
  CreateCustomLanguageModelParams,
  DoesReleaseNoteExistParams,
  ApproveProposalResult,
  ImportAppResult,
  ImportAppParams,
  RenameBranchParams,
} from "./ipc_types";
import type { ProposalResult } from "@/lib/schemas";
import { showError } from "@/lib/toast";
import { WebIpcClient } from "./web_ipc_client";

export interface ChatStreamCallbacks {
  onUpdate: (messages: Message[]) => void;
  onEnd: (response: ChatResponseEnd) => void;
  onError: (error: string) => void;
}

export interface AppStreamCallbacks {
  onOutput: (output: AppOutput) => void;
}

export interface GitHubDeviceFlowUpdateData {
  userCode?: string;
  verificationUri?: string;
  message?: string;
}

export interface GitHubDeviceFlowSuccessData {
  message?: string;
}

export interface GitHubDeviceFlowErrorData {
  error: string;
}

export interface DeepLinkData {
  type: string;
  url?: string;
}

interface DeleteCustomModelParams {
  providerId: string;
  modelApiName: string;
}

export class IpcClient {
  private static instance: IpcClient;
  private ipcRenderer: IpcRenderer | null = null;
  private web: WebIpcClient | null = null;
  private chatStreams: Map<number, ChatStreamCallbacks>;
  private appStreams: Map<number, AppStreamCallbacks>;
  private constructor() {
    const hasElectron =
      typeof window !== "undefined" && (window as any)?.electron?.ipcRenderer;
    if (hasElectron) {
      this.ipcRenderer = (window as any).electron.ipcRenderer as IpcRenderer;
    } else {
      this.web = new WebIpcClient();
    }
    this.chatStreams = new Map();
    this.appStreams = new Map();
    if (this.ipcRenderer) {
      // Set up listeners for stream events
      this.ipcRenderer.on("chat:response:chunk", (data) => {
        if (
          data &&
          typeof data === "object" &&
          "chatId" in data &&
          "messages" in data
        ) {
          const { chatId, messages } = data as {
            chatId: number;
            messages: Message[];
          };

          const callbacks = this.chatStreams.get(chatId);
          if (callbacks) {
            callbacks.onUpdate(messages);
          } else {
            console.warn(
              `[IPC] No callbacks found for chat ${chatId}`,
              this.chatStreams,
            );
          }
        } else {
          showError(new Error(`[IPC] Invalid chunk data received: ${data}`));
        }
      });

      this.ipcRenderer.on("app:output", (data) => {
        if (
          data &&
          typeof data === "object" &&
          "type" in data &&
          "message" in data &&
          "appId" in data
        ) {
          const { type, message, appId } = data as unknown as AppOutput;
          const callbacks = this.appStreams.get(appId);
          if (callbacks) {
            callbacks.onOutput({ type, message, appId, timestamp: Date.now() });
          }
        } else {
          showError(
            new Error(`[IPC] Invalid app output data received: ${data}`),
          );
        }
      });

      this.ipcRenderer.on("chat:response:end", (payload) => {
        const { chatId } = payload as unknown as ChatResponseEnd;
        const callbacks = this.chatStreams.get(chatId);
        if (callbacks) {
          callbacks.onEnd(payload as unknown as ChatResponseEnd);
          console.debug("chat:response:end");
          this.chatStreams.delete(chatId);
        } else {
          console.error(
            new Error(
              `[IPC] No callbacks found for chat ${chatId} on stream end`,
            ),
          );
        }
      });

      this.ipcRenderer.on("chat:response:error", (error) => {
        console.debug("chat:response:error");
        if (typeof error === "string") {
          for (const [chatId, callbacks] of this.chatStreams.entries()) {
            callbacks.onError(error);
            this.chatStreams.delete(chatId);
          }
        } else {
          console.error("[IPC] Invalid error data received:", error);
        }
      });
    }
  }

  public static getInstance(): IpcClient {
    if (!IpcClient.instance) {
      IpcClient.instance = new IpcClient();
    }
    return IpcClient.instance;
  }

  private isWeb() {
    return this.web !== null;
  }

  public async reloadEnvPath(): Promise<void> {
    if (this.isWeb()) return;
    await this.ipcRenderer!.invoke("reload-env-path");
  }

  // Create a new app with an initial chat
  public async createApp(params: CreateAppParams): Promise<CreateAppResult> {
    if (this.isWeb()) return this.web!.createApp(params);
    return this.ipcRenderer!.invoke("create-app", params);
  }

  public async getApp(appId: number): Promise<App> {
    if (this.isWeb()) return this.web!.getApp(appId);
    return this.ipcRenderer!.invoke("get-app", appId);
  }

  public async getChat(chatId: number): Promise<Chat> {
    try {
      if (this.isWeb()) return this.web!.getChat(chatId);
      const data = await this.ipcRenderer!.invoke("get-chat", chatId);
      return data;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Get all chats
  public async getChats(appId?: number): Promise<ChatSummary[]> {
    try {
      if (this.isWeb()) return this.web!.getChats(appId) as any;
      const data = await this.ipcRenderer!.invoke("get-chats", appId);
      return ChatSummariesSchema.parse(data);
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Get all apps
  public async listApps(): Promise<ListAppsResponse> {
    if (this.isWeb()) return this.web!.listApps();
    return this.ipcRenderer!.invoke("list-apps");
  }

  public async readAppFile(appId: number, filePath: string): Promise<string> {
    if (this.isWeb()) throw new Error("Not supported on web");
    return this.ipcRenderer!.invoke("read-app-file", {
      appId,
      filePath,
    });
  }

  // Edit a file in an app directory
  public async editAppFile(
    appId: number,
    filePath: string,
    content: string,
  ): Promise<void> {
    if (this.isWeb()) throw new Error("Not supported on web");
    await this.ipcRenderer!.invoke("edit-app-file", {
      appId,
      filePath,
      content,
    });
  }

  // New method for streaming responses
  public streamMessage(
    prompt: string,
    options: {
      chatId: number;
      redo?: boolean;
      attachments?: File[];
      onUpdate: (messages: Message[]) => void;
      onEnd: (response: ChatResponseEnd) => void;
      onError: (error: string) => void;
    },
  ): void {
    if (this.isWeb()) {
      this.web!.streamMessage(prompt, options as any);
      return;
    }
    const { chatId, redo, attachments, onUpdate, onEnd, onError } = options;
    this.chatStreams.set(chatId, { onUpdate, onEnd, onError });

    // Handle file attachments if provided
    if (attachments && attachments.length > 0) {
      // Process each file and convert to base64
      Promise.all(
        attachments.map(async (file) => {
          return new Promise<{ name: string; type: string; data: string }>(
            (resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => {
                resolve({
                  name: file.name,
                  type: file.type,
                  data: reader.result as string,
                });
              };
              reader.onerror = () =>
                reject(new Error(`Failed to read file: ${file.name}`));
              reader.readAsDataURL(file);
            },
          );
        }),
      )
        .then((fileDataArray) => {
          // Use invoke to start the stream and pass the chatId and attachments
          this.ipcRenderer!.invoke("chat:stream", {
            prompt,
            chatId,
            redo,
            attachments: fileDataArray,
          }).catch((err) => {
            showError(err);
            onError(String(err));
            this.chatStreams.delete(chatId);
          });
        })
        .catch((err) => {
          showError(err);
          onError(String(err));
          this.chatStreams.delete(chatId);
        });
    } else {
      // No attachments, proceed normally
      this.ipcRenderer!.invoke("chat:stream", {
        prompt,
        chatId,
        redo,
      }).catch((err) => {
        showError(err);
        onError(String(err));
        this.chatStreams.delete(chatId);
      });
    }
  }

  // Method to cancel an ongoing stream
  public cancelChatStream(chatId: number): void {
    if (this.isWeb()) return;
    this.ipcRenderer!.invoke("chat:cancel", chatId);
    const callbacks = this.chatStreams.get(chatId);
    if (callbacks) {
      this.chatStreams.delete(chatId);
    } else {
      console.error("Tried canceling chat that doesn't exist");
    }
  }

  // Create a new chat for an app
  public async createChat(appId: number): Promise<number> {
    if (this.isWeb()) return this.web!.createChat(appId);
    return this.ipcRenderer!.invoke("create-chat", appId);
  }

  public async deleteChat(chatId: number): Promise<void> {
    if (this.isWeb()) return this.web!.deleteChat(chatId);
    await this.ipcRenderer!.invoke("delete-chat", chatId);
  }

  public async deleteMessages(chatId: number): Promise<void> {
    if (this.isWeb()) return this.web!.deleteMessages(chatId);
    await this.ipcRenderer!.invoke("delete-messages", chatId);
  }

  // Open an external URL using the default browser
  public async openExternalUrl(url: string): Promise<void> {
    if (this.isWeb()) {
      window.open(url, "_blank");
      return;
    }
    await this.ipcRenderer!.invoke("open-external-url", url);
  }

  public async showItemInFolder(fullPath: string): Promise<void> {
    if (this.isWeb()) return;
    await this.ipcRenderer!.invoke("show-item-in-folder", fullPath);
  }

  // Run an app
  public async runApp(
    appId: number,
    onOutput: (output: AppOutput) => void,
  ): Promise<void> {
    if (this.isWeb()) return this.web!.runApp(appId, onOutput);
    await this.ipcRenderer!.invoke("run-app", { appId });
    this.appStreams.set(appId, { onOutput });
  }

  // Stop a running app
  public async stopApp(appId: number): Promise<void> {
    if (this.isWeb()) return this.web!.stopApp(appId);
    await this.ipcRenderer!.invoke("stop-app", { appId });
  }

  // Restart a running app
  public async restartApp(
    appId: number,
    onOutput: (output: AppOutput) => void,
    removeNodeModules?: boolean,
  ): Promise<{ success: boolean }> {
    try {
      if (this.isWeb())
        return this.web!.restartApp(appId, onOutput, removeNodeModules);
      const result = await this.ipcRenderer!.invoke("restart-app", {
        appId,
        removeNodeModules,
      });
      this.appStreams.set(appId, { onOutput });
      return result;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Get allow-listed environment variables
  public async getEnvVars(): Promise<Record<string, string | undefined>> {
    try {
      if (this.isWeb()) return this.web!.getEnvVars();
      const envVars = await this.ipcRenderer!.invoke("get-env-vars");
      return envVars as Record<string, string | undefined>;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // List all versions (commits) of an app
  public async listVersions({ appId }: { appId: number }): Promise<Version[]> {
    try {
      if (this.isWeb()) return this.web!.listVersions({ appId }) as any;
      const versions = await this.ipcRenderer!.invoke("list-versions", {
        appId,
      });
      return versions;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Revert to a specific version
  public async revertVersion({
    appId,
    previousVersionId,
  }: {
    appId: number;
    previousVersionId: string;
  }): Promise<void> {
    if (this.isWeb())
      return this.web!.revertVersion({ appId, previousVersionId });
    await this.ipcRenderer!.invoke("revert-version", {
      appId,
      previousVersionId,
    });
  }

  // Checkout a specific version without creating a revert commit
  public async checkoutVersion({
    appId,
    versionId,
  }: {
    appId: number;
    versionId: string;
  }): Promise<void> {
    if (this.isWeb()) return this.web!.checkoutVersion({ appId, versionId });
    await this.ipcRenderer!.invoke("checkout-version", {
      appId,
      versionId,
    });
  }

  // Get the current branch of an app
  public async getCurrentBranch(appId: number): Promise<BranchResult> {
    if (this.isWeb()) return this.web!.getCurrentBranch(appId);
    return this.ipcRenderer!.invoke("get-current-branch", {
      appId,
    });
  }

  // Get user settings
  public async getUserSettings(): Promise<UserSettings> {
    try {
      if (this.isWeb()) return this.web!.getUserSettings();
      const settings = await this.ipcRenderer!.invoke("get-user-settings");
      return settings;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Update user settings
  public async setUserSettings(
    settings: Partial<UserSettings>,
  ): Promise<UserSettings> {
    try {
      if (this.isWeb()) return this.web!.setUserSettings(settings);
      const updatedSettings = await this.ipcRenderer!.invoke(
        "set-user-settings",
        settings,
      );
      return updatedSettings;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Delete an app and all its files
  public async deleteApp(appId: number): Promise<void> {
    if (this.isWeb()) return this.web!.deleteApp(appId);
    await this.ipcRenderer!.invoke("delete-app", { appId });
  }

  // Rename an app (update name and path)
  public async renameApp({
    appId,
    appName,
    appPath,
  }: {
    appId: number;
    appName: string;
    appPath: string;
  }): Promise<void> {
    if (this.isWeb()) return this.web!.renameApp({ appId, appName, appPath });
    await this.ipcRenderer!.invoke("rename-app", {
      appId,
      appName,
      appPath,
    });
  }

  // Reset all - removes all app files, settings, and drops the database
  public async resetAll(): Promise<void> {
    if (this.isWeb()) return this.web!.resetAll();
    await this.ipcRenderer!.invoke("reset-all");
  }

  public async addDependency({
    chatId,
    packages,
  }: {
    chatId: number;
    packages: string[];
  }): Promise<void> {
    if (this.isWeb()) return this.web!.addDependency({ chatId, packages });
    await this.ipcRenderer!.invoke("chat:add-dep", {
      chatId,
      packages,
    });
  }

  // Check Node.js and npm status
  public async getNodejsStatus(): Promise<NodeSystemInfo> {
    if (this.isWeb()) return this.web!.getNodejsStatus();
    return this.ipcRenderer!.invoke("nodejs-status");
  }

  // --- GitHub Device Flow ---
  public startGithubDeviceFlow(appId: number | null): void {
    if (this.isWeb()) return this.web!.startGithubDeviceFlow(appId);
    this.ipcRenderer!.invoke("github:start-flow", { appId });
  }

  public onGithubDeviceFlowUpdate(
    callback: (data: GitHubDeviceFlowUpdateData) => void,
  ): () => void {
    if (this.isWeb()) return this.web!.onGithubDeviceFlowUpdate(callback);
    const listener = (data: any) => {
      console.log("github:flow-update", data);
      callback(data as GitHubDeviceFlowUpdateData);
    };
    this.ipcRenderer!.on("github:flow-update", listener);
    // Return a function to remove the listener
    return () => {
      this.ipcRenderer!.removeListener("github:flow-update", listener);
    };
  }

  public onGithubDeviceFlowSuccess(
    callback: (data: GitHubDeviceFlowSuccessData) => void,
  ): () => void {
    if (this.isWeb()) return this.web!.onGithubDeviceFlowSuccess(callback);
    const listener = (data: any) => {
      console.log("github:flow-success", data);
      callback(data as GitHubDeviceFlowSuccessData);
    };
    this.ipcRenderer!.on("github:flow-success", listener);
    return () => {
      this.ipcRenderer!.removeListener("github:flow-success", listener);
    };
  }

  public onGithubDeviceFlowError(
    callback: (data: GitHubDeviceFlowErrorData) => void,
  ): () => void {
    if (this.isWeb()) return this.web!.onGithubDeviceFlowError(callback);
    const listener = (data: any) => {
      console.log("github:flow-error", data);
      callback(data as GitHubDeviceFlowErrorData);
    };
    this.ipcRenderer!.on("github:flow-error", listener);
    return () => {
      this.ipcRenderer!.removeListener("github:flow-error", listener);
    };
  }
  // --- End GitHub Device Flow ---

  // --- GitHub Repo Management ---
  public async checkGithubRepoAvailable(
    org: string,
    repo: string,
  ): Promise<{ available: boolean; error?: string }> {
    if (this.isWeb()) return this.web!.checkGithubRepoAvailable(org, repo);
    return this.ipcRenderer!.invoke("github:is-repo-available", {
      org,
      repo,
    });
  }

  public async createGithubRepo(
    org: string,
    repo: string,
    appId: number,
  ): Promise<void> {
    if (this.isWeb()) return this.web!.createGithubRepo(org, repo, appId);
    await this.ipcRenderer!.invoke("github:create-repo", {
      org,
      repo,
      appId,
    });
  }

  // Sync (push) local repo to GitHub
  public async syncGithubRepo(
    appId: number,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isWeb()) return this.web!.syncGithubRepo(appId);
      const result = await this.ipcRenderer!.invoke("github:push", { appId });
      return result as { success: boolean; error?: string };
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  public async disconnectGithubRepo(appId: number): Promise<void> {
    if (this.isWeb()) return this.web!.disconnectGithubRepo(appId);
    await this.ipcRenderer!.invoke("github:disconnect", {
      appId,
    });
  }
  // --- End GitHub Repo Management ---

  // Get the main app version
  public async getAppVersion(): Promise<string> {
    if (this.isWeb()) return this.web!.getAppVersion();
    const result = await this.ipcRenderer!.invoke("get-app-version");
    return result.version as string;
  }

  // Get proposal details
  public async getProposal(chatId: number): Promise<ProposalResult | null> {
    try {
      if (this.isWeb()) return this.web!.getProposal(chatId);
      const data = await this.ipcRenderer!.invoke("get-proposal", { chatId });
      // Assuming the main process returns data matching the ProposalResult interface
      // Add a type check/guard if necessary for robustness
      return data as ProposalResult | null;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Example methods for listening to events (if needed)
  // public on(channel: string, func: (...args: any[]) => void): void {

  // --- Proposal Management ---
  public async approveProposal({
    chatId,
    messageId,
  }: {
    chatId: number;
    messageId: number;
  }): Promise<ApproveProposalResult> {
    if (this.isWeb()) return this.web!.approveProposal({ chatId, messageId });
    return this.ipcRenderer!.invoke("approve-proposal", {
      chatId,
      messageId,
    });
  }

  public async rejectProposal({
    chatId,
    messageId,
  }: {
    chatId: number;
    messageId: number;
  }): Promise<void> {
    if (this.isWeb()) return this.web!.rejectProposal({ chatId, messageId });
    await this.ipcRenderer!.invoke("reject-proposal", {
      chatId,
      messageId,
    });
  }
  // --- End Proposal Management ---

  // --- Supabase Management ---
  public async listSupabaseProjects(): Promise<any[]> {
    if (this.isWeb()) return this.web!.listSupabaseProjects();
    return this.ipcRenderer!.invoke("supabase:list-projects");
  }

  public async setSupabaseAppProject(
    project: string,
    app: number,
  ): Promise<void> {
    if (this.isWeb()) return this.web!.setSupabaseAppProject(project, app);
    await this.ipcRenderer!.invoke("supabase:set-app-project", {
      project,
      app,
    });
  }

  public async unsetSupabaseAppProject(app: number): Promise<void> {
    if (this.isWeb()) return this.web!.unsetSupabaseAppProject(app);
    await this.ipcRenderer!.invoke("supabase:unset-app-project", {
      app,
    });
  }
  // --- End Supabase Management ---

  public async getSystemDebugInfo(): Promise<SystemDebugInfo> {
    if (this.isWeb()) return this.web!.getSystemDebugInfo();
    return this.ipcRenderer!.invoke("get-system-debug-info");
  }

  public async getChatLogs(chatId: number): Promise<ChatLogsData> {
    if (this.isWeb()) return this.web!.getChatLogs(chatId);
    return this.ipcRenderer!.invoke("get-chat-logs", chatId);
  }

  public async uploadToSignedUrl(
    url: string,
    contentType: string,
    data: any,
  ): Promise<void> {
    if (this.isWeb())
      return this.web!.uploadToSignedUrl(url, contentType, data);
    await this.ipcRenderer!.invoke("upload-to-signed-url", {
      url,
      contentType,
      data,
    });
  }

  public async listLocalOllamaModels(): Promise<LocalModel[]> {
    if (this.isWeb()) return this.web!.listLocalOllamaModels();
    const response = await this.ipcRenderer!.invoke("local-models:list-ollama");
    return response?.models || [];
  }

  public async listLocalLMStudioModels(): Promise<LocalModel[]> {
    if (this.isWeb()) return this.web!.listLocalLMStudioModels();
    const response = await this.ipcRenderer!.invoke(
      "local-models:list-lmstudio",
    );
    return response?.models || [];
  }

  // Listen for deep link events
  public onDeepLinkReceived(
    callback: (data: DeepLinkData) => void,
  ): () => void {
    if (this.isWeb()) return this.web!.onDeepLinkReceived(callback);
    const listener = (data: any) => {
      callback(data as DeepLinkData);
    };
    this.ipcRenderer!.on("deep-link-received", listener);
    return () => {
      this.ipcRenderer!.removeListener("deep-link-received", listener);
    };
  }

  // Count tokens for a chat and input
  public async countTokens(
    params: TokenCountParams,
  ): Promise<TokenCountResult> {
    try {
      if (this.isWeb()) return this.web!.countTokens(params);
      const result = await this.ipcRenderer!.invoke(
        "chat:count-tokens",
        params,
      );
      return result as TokenCountResult;
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Window control methods
  public async minimizeWindow(): Promise<void> {
    try {
      if (this.isWeb()) return this.web!.minimizeWindow();
      await this.ipcRenderer!.invoke("window:minimize");
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  public async maximizeWindow(): Promise<void> {
    try {
      if (this.isWeb()) return this.web!.maximizeWindow();
      await this.ipcRenderer!.invoke("window:maximize");
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  public async closeWindow(): Promise<void> {
    try {
      if (this.isWeb()) return this.web!.closeWindow();
      await this.ipcRenderer!.invoke("window:close");
    } catch (error) {
      showError(error);
      throw error;
    }
  }

  // Get system platform (win32, darwin, linux)
  public async getSystemPlatform(): Promise<string> {
    if (this.isWeb()) return this.web!.getSystemPlatform();
    return this.ipcRenderer!.invoke("get-system-platform");
  }

  public async doesReleaseNoteExist(
    params: DoesReleaseNoteExistParams,
  ): Promise<{ exists: boolean; url?: string }> {
    if (this.isWeb()) return this.web!.doesReleaseNoteExist(params);
    return this.ipcRenderer!.invoke("does-release-note-exist", params);
  }

  public async getLanguageModelProviders(): Promise<LanguageModelProvider[]> {
    if (this.isWeb()) return this.web!.getLanguageModelProviders();
    return this.ipcRenderer!.invoke("get-language-model-providers");
  }

  public async getLanguageModels(params: {
    providerId: string;
  }): Promise<LanguageModel[]> {
    if (this.isWeb()) return this.web!.getLanguageModels(params);
    return this.ipcRenderer!.invoke("get-language-models", params);
  }

  public async getLanguageModelsByProviders(): Promise<
    Record<string, LanguageModel[]>
  > {
    if (this.isWeb()) return this.web!.getLanguageModelsByProviders();
    return this.ipcRenderer!.invoke("get-language-models-by-providers");
  }

  public async createCustomLanguageModelProvider({
    id,
    name,
    apiBaseUrl,
    envVarName,
  }: CreateCustomLanguageModelProviderParams): Promise<LanguageModelProvider> {
    if (this.isWeb())
      return this.web!.createCustomLanguageModelProvider({
        id,
        name,
        apiBaseUrl,
        envVarName,
      });
    return this.ipcRenderer!.invoke("create-custom-language-model-provider", {
      id,
      name,
      apiBaseUrl,
      envVarName,
    });
  }

  public async createCustomLanguageModel(
    params: CreateCustomLanguageModelParams,
  ): Promise<void> {
    if (this.isWeb()) return this.web!.createCustomLanguageModel(params);
    await this.ipcRenderer!.invoke("create-custom-language-model", params);
  }

  public async deleteCustomLanguageModel(modelId: string): Promise<void> {
    if (this.isWeb()) return this.web!.deleteCustomLanguageModel(modelId);
    return this.ipcRenderer!.invoke("delete-custom-language-model", modelId);
  }

  async deleteCustomModel(params: DeleteCustomModelParams): Promise<void> {
    if (this.isWeb()) return this.web!.deleteCustomModel(params);
    return this.ipcRenderer!.invoke("delete-custom-model", params);
  }

  async deleteCustomLanguageModelProvider(providerId: string): Promise<void> {
    if (this.isWeb())
      return this.web!.deleteCustomLanguageModelProvider(providerId);
    return this.ipcRenderer!.invoke("delete-custom-language-model-provider", {
      providerId,
    });
  }

  public async selectAppFolder(): Promise<{
    path: string | null;
    name: string | null;
  }> {
    if (this.isWeb()) return this.web!.selectAppFolder();
    return this.ipcRenderer!.invoke("select-app-folder");
  }

  public async checkAiRules(params: {
    path: string;
  }): Promise<{ exists: boolean }> {
    if (this.isWeb()) return this.web!.checkAiRules(params);
    return this.ipcRenderer!.invoke("check-ai-rules", params);
  }

  public async importApp(params: ImportAppParams): Promise<ImportAppResult> {
    if (this.isWeb()) return this.web!.importApp(params);
    return this.ipcRenderer!.invoke("import-app", params);
  }

  async checkAppName(params: {
    appName: string;
  }): Promise<{ exists: boolean }> {
    if (this.isWeb()) return this.web!.checkAppName(params);
    return this.ipcRenderer!.invoke("check-app-name", params);
  }

  public async renameBranch(params: RenameBranchParams): Promise<void> {
    if (this.isWeb()) return this.web!.renameBranch(params);
    await this.ipcRenderer!.invoke("rename-branch", params);
  }
}
