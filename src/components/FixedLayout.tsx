import React, { useState, useEffect } from "react";
import { MessageSquare, X, Palette } from "lucide-react";
import { Button } from "./ui/button";
import { WebIpcClient } from "../ipc/web_ipc_client";

interface FixedLayoutProps {
  children?: React.ReactNode;
}

// Simple chat interface for web demo
interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface DemoChat {
  id: number;
  title: string;
  messages: Message[];
}

export function FixedLayout({ children }: FixedLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [currentChat, setCurrentChat] = useState<DemoChat | null>(null);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [webClient, setWebClient] = useState<WebIpcClient | null>(null);

  useEffect(() => {
    // Initialize web client
    const client = new WebIpcClient();
    setWebClient(client);

    // Create or load a demo chat
    initializeDemoChat(client);
  }, []);

  const initializeDemoChat = async (client: WebIpcClient) => {
    try {
      const chats = await client.getChats();
      if (chats.length > 0) {
        const chat = await client.getChat(chats[0].id);
        setCurrentChat(chat as DemoChat);
      } else {
        // Create a demo chat
        const chatId = await client.createChat(0);
        const newChat = await client.getChat(chatId);
        setCurrentChat({
          id: newChat.id,
          title: "محادثة تجريبية",
          messages: [],
        });
      }
    } catch (error) {
      console.error("Error initializing chat:", error);
      // Fallback demo chat
      setCurrentChat({
        id: 1,
        title: "محادثة تجريبية",
        messages: [
          {
            id: 1,
            role: "assistant",
            content:
              "مرحباً! أنا Dyad AI. يمكنني مساعدتك في تطوير التطبيقات. اكتب رسالة لتجربة الواجهة!",
          },
        ],
      });
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || !webClient || !currentChat) return;

    setIsLoading(true);

    try {
      webClient.streamMessage(inputMessage, {
        chatId: currentChat.id,
        onUpdate: (messages) => {
          setCurrentChat((prev) =>
            prev
              ? {
                  ...prev,
                  messages: messages as Message[],
                }
              : null,
          );
        },
        onEnd: () => {
          setIsLoading(false);
        },
        onError: (error) => {
          console.error("Chat error:", error);
          setIsLoading(false);
        },
      });

      setInputMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="h-screen bg-background relative">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-6 z-[100]">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              Dyad AI
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {/* Preview Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
            className="hidden md:flex"
          >
            <Palette size={16} className="ml-2" />
            {showPreview ? "إخفاء المعاينة" : "إظهار المعاينة"}
          </Button>

          {/* Chat Toggle Button */}
          <Button
            onClick={() => setIsChatOpen(!isChatOpen)}
            size="sm"
            className={`transition-colors ${
              isChatOpen
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
            }`}
          >
            <MessageSquare size={16} className="ml-2" />
            <span className="hidden sm:inline">
              {isChatOpen ? "إخفاء الدردشة" : "فتح الدردشة"}
            </span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-16 h-screen flex overflow-hidden">
        {/* Left Panel - App Content */}
        <div className={`${showPreview ? "flex-1" : "w-full"} flex flex-col`}>
          <div className="flex-1 p-6 overflow-auto">
            {children ? (
              <div className="max-w-6xl mx-auto">{children}</div>
            ) : (
              <div className="h-full flex items-center justify-center text-center">
                <div className="max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
                    <MessageSquare
                      size={32}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    مرحباً بك في Dyad AI
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    اختر تطبيقاً من الشريط الجانبي أو ابدأ محادثة جديدة مع
                    الذكاء الاصطناعي لتطوير تطبيقاتك
                  </p>

                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl mb-2">💡</div>
                      <div className="font-medium mb-1">إنشاء تطبيقات</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        بناء تطبيقات متكاملة
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl mb-2">🛠️</div>
                      <div className="font-medium mb-1">إدارة الكود</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        تحرير وتطوير الملفات
                      </div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl mb-2">🎨</div>
                      <div className="font-medium mb-1">تصميم الواجهات</div>
                      <div className="text-gray-500 dark:text-gray-400">
                        واجهات تفاعلية جميلة
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview */}
        {showPreview && (
          <div className="w-1/2 border-l border-border bg-white dark:bg-gray-900">
            <div className="h-full flex flex-col">
              <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-gray-50 dark:bg-gray-800">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  معاينة التطبيق
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                  className="p-1 h-8 w-8"
                >
                  <X size={14} />
                </Button>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-4xl mb-4">🖥️</div>
                  <p>معاينة التطبيق ستظهر هنا</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Simple Chat Panel */}
      {isChatOpen && (
        <div className="fixed bottom-0 left-0 right-0 z-[90] h-96 bg-white dark:bg-gray-900 border-t border-border shadow-lg">
          <div className="h-12 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between px-6">
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                محادثة مع Dyad AI
              </span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsChatOpen(false)}
              className="h-8 w-8 p-0"
            >
              <X size={18} />
            </Button>
          </div>

          <div className="h-80 flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentChat?.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex space-x-3 rtl:space-x-reverse">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="اكتب رسالتك هنا..."
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  إرسال
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
