import React, { useState, useEffect } from "react";
import { Home, MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "./ui/button";
import { WebIpcClient } from "../ipc/web_ipc_client";

interface App {
  id: number;
  name: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Chat {
  id: number;
  title: string;
  appId?: number;
}

interface WebAppSidebarProps {
  onAppSelect?: (appId: number) => void;
  onChatSelect?: (chatId: number) => void;
  selectedAppId?: number;
  selectedChatId?: number;
}

export function WebAppSidebar({
  onAppSelect,
  onChatSelect,
  selectedAppId,
  selectedChatId,
}: WebAppSidebarProps) {
  const [apps, setApps] = useState<App[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [webClient, setWebClient] = useState<WebIpcClient | null>(null);
  const [activeTab, setActiveTab] = useState<"apps" | "chats">("apps");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const client = new WebIpcClient();
    setWebClient(client);
    loadApps(client);
    loadChats(client);
  }, []);

  const loadApps = async (client: WebIpcClient) => {
    try {
      const response = await client.listApps();
      setApps(response.apps);
    } catch (error) {
      console.error("Error loading apps:", error);
    }
  };

  const loadChats = async (client: WebIpcClient) => {
    try {
      const chatsData = await client.getChats();
      setChats(chatsData);
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  const createNewApp = async () => {
    if (!webClient) return;

    setIsLoading(true);
    try {
      const appName = prompt("اسم التطبيق الجديد:");
      if (appName) {
        await webClient.createApp({ name: appName });
        await loadApps(webClient);
        await loadChats(webClient);
      }
    } catch (error) {
      console.error("Error creating app:", error);
      alert("خطأ في إنشاء التطبيق");
    } finally {
      setIsLoading(false);
    }
  };

  const createNewChat = async () => {
    if (!webClient) return;

    setIsLoading(true);
    try {
      await webClient.createChat(selectedAppId || 0);
      await loadChats(webClient);
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("خطأ في إنشاء المحادثة");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApp = async (appId: number, appName: string) => {
    if (!webClient) return;

    if (confirm(`هل تريد حذف التطبيق "${appName}"؟`)) {
      try {
        await webClient.deleteApp(appId);
        await loadApps(webClient);
        await loadChats(webClient);
      } catch (error) {
        console.error("Error deleting app:", error);
        alert("خطأ في حذف التطبيق");
      }
    }
  };

  const deleteChat = async (chatId: number, chatTitle: string) => {
    if (!webClient) return;

    if (confirm(`هل تريد حذف المحادثة "${chatTitle}"؟`)) {
      try {
        await webClient.deleteChat(chatId);
        await loadChats(webClient);
      } catch (error) {
        console.error("Error deleting chat:", error);
        alert("خطأ في حذف المحادثة");
      }
    }
  };

  return (
    <div className="w-64 h-full bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <h1 className="font-bold text-gray-900 dark:text-gray-100">Dyad</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("apps")}
          className={`flex-1 p-3 text-sm font-medium ${
            activeTab === "apps"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <Home size={16} className="inline ml-2" />
          التطبيقات
        </button>
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 p-3 text-sm font-medium ${
            activeTab === "chats"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <MessageSquare size={16} className="inline ml-2" />
          المحادثات
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === "apps" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                التطبيقات ({apps.length})
              </h3>
              <Button
                onClick={createNewApp}
                disabled={isLoading}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Plus size={14} />
              </Button>
            </div>

            {apps.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Home size={24} className="mx-auto mb-2" />
                <p className="text-sm">لا توجد تطبيقات</p>
                <p className="text-xs">انقر على + لإنشاء تطبيق جديد</p>
              </div>
            ) : (
              apps.map((app) => (
                <div
                  key={app.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedAppId === app.id
                      ? "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                  }`}
                  onClick={() => onAppSelect?.(app.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {app.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(app.createdAt).toLocaleDateString("ar")}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteApp(app.id, app.name);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "chats" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                المحادثات ({chats.length})
              </h3>
              <Button
                onClick={createNewChat}
                disabled={isLoading}
                size="sm"
                className="h-8 w-8 p-0"
              >
                <Plus size={14} />
              </Button>
            </div>

            {chats.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <MessageSquare size={24} className="mx-auto mb-2" />
                <p className="text-sm">لا توجد محادثات</p>
                <p className="text-xs">انقر على + لإنشاء محادثة جديدة</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  className={`group p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedChatId === chat.id
                      ? "bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent"
                  }`}
                  onClick={() => onChatSelect?.(chat.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {chat.title}
                      </h4>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id, chat.title);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-700 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-center text-xs text-gray-500 dark:text-gray-400">
          Dyad AI - Web Demo
        </div>
      </div>
    </div>
  );
}
