import React, { useState, useRef, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { chatMessagesAtom, chatStreamCountAtom } from "../atoms/chatAtoms";
import { IpcClient } from "@/ipc/ipc_client";
import { MessagesList } from "./chat/MessagesList";
import { ChatInput } from "./chat/ChatInput";
import { ChatError } from "./chat/ChatError";
import { VersionPane } from "./chat/VersionPane";
import { History, GitBranch } from "lucide-react";

interface ChatContentProps {
  chatId?: number;
  selectedAppId?: number;
  isCompact?: boolean;
}

export function ChatContent({ chatId, selectedAppId, isCompact = false }: ChatContentProps) {
  const [messages, setMessages] = useAtom(chatMessagesAtom);
  const [isVersionPaneOpen, setIsVersionPaneOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // Scroll-related properties
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const userScrollTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef<number>(0);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const container = messagesContainerRef.current;
    const currentScrollTop = container.scrollTop;

    if (currentScrollTop < lastScrollTopRef.current) {
      setIsUserScrolling(true);

      if (userScrollTimeoutRef.current) {
        window.clearTimeout(userScrollTimeoutRef.current);
      }

      userScrollTimeoutRef.current = window.setTimeout(() => {
        setIsUserScrolling(false);
      }, 1000);
    }

    lastScrollTopRef.current = currentScrollTop;
  };

  const fetchChatMessages = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      return;
    }
    try {
      const chat = await IpcClient.getInstance().getChat(chatId);
      setMessages(chat.messages);
    } catch (err) {
      console.error("Error fetching chat messages:", err);
      setError((err as Error).message || "Failed to load chat messages");
    }
  }, [chatId, setMessages]);

  useEffect(() => {
    fetchChatMessages();
  }, [fetchChatMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (container) {
        container.removeEventListener("scroll", handleScroll);
      }
      if (userScrollTimeoutRef.current) {
        window.clearTimeout(userScrollTimeoutRef.current);
      }
    };
  }, []);

  // Auto-scroll effect when messages change
  useEffect(() => {
    if (!isUserScrolling && messagesContainerRef.current && messages.length > 0) {
      const { scrollTop, clientHeight, scrollHeight } = messagesContainerRef.current;
      const threshold = 280;
      const isNearBottom = scrollHeight - (scrollTop + clientHeight) <= threshold;

      if (isNearBottom) {
        requestAnimationFrame(() => {
          scrollToBottom("instant");
        });
      }
    }
  }, [messages, isUserScrolling]);

  if (!selectedAppId) {
    return (
      <div className="h-full flex items-center justify-center text-center p-8">
        <div>
          <div className="text-6xl mb-6">🤖</div>
          <h2 className="text-2xl font-bold mb-4">أهلاً وسهلاً!</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            مرحباً بك في Dyad. اختر تطبيقاً من الشريط الجانبي لبدء محادثة مع الذكاء الاصطناعي.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
              <span>💡</span>
              <span>يمكنك إنشاء تطبيقات وتطويرها باستخدام الذكاء الاصطناعي</span>
            </div>
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
              <span>🛠️</span>
              <span>إدارة الكود والملفات بسهولة</span>
            </div>
            <div className="flex items-center justify-center space-x-2 rtl:space-x-reverse">
              <span>🎨</span>
              <span>تصميم واجهات المستخدم التفاعلية</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Controls */}
      {!isCompact && (
        <div className="bg-background/80 backdrop-blur-sm border-b border-border px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">محادثة: {chatId || "جديدة"}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsVersionPaneOpen(!isVersionPaneOpen)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors flex items-center space-x-1 ${
                  isVersionPaneOpen
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title="إدارة الإصدارات"
              >
                <GitBranch size={14} />
                <span className="hidden sm:inline">الإصدارات</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages and Version Pane Container */}
      <div className="flex-1 flex overflow-hidden">
        {!isVersionPaneOpen && (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Messages List */}
            <div className="flex-1 overflow-hidden">
              <MessagesList
                messages={messages}
                messagesEndRef={messagesEndRef}
                ref={messagesContainerRef}
              />
            </div>
            
            {/* Error Display */}
            <ChatError error={error} onDismiss={() => setError(null)} />
            
            {/* Chat Input - Fixed at bottom */}
            <div className="bg-background/95 backdrop-blur-sm border-t border-border">
              <ChatInput chatId={chatId} />
            </div>
          </div>
        )}

        {/* Version Pane */}
        <VersionPane
          isVisible={isVersionPaneOpen}
          onClose={() => setIsVersionPaneOpen(false)}
        />
      </div>
    </div>
  );
}