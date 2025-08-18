import React, { useState, useEffect } from "react";
import { X, Maximize2, Minimize2, Minus, MessageCircle, Sparkles } from "lucide-react";
import { useAtom, useAtomValue } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { useChats } from "@/hooks/useChats";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { ChatContent } from "./ChatContent";
import { Button } from "./ui/button";

interface SlidingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  size: "minimized" | "normal" | "maximized";
  onToggleSize: () => void;
  className?: string;
}

export function SlidingChatPanel({
  isOpen,
  onClose,
  size,
  onToggleSize,
  className
}: SlidingChatPanelProps) {
  const selectedAppId = useAtomValue(selectedAppIdAtom);
  const { chats, loading } = useChats(selectedAppId);
  const navigate = useNavigate();
  
  // Get current chat ID from URL or use first available chat
  let { id: chatId } = useSearch({ from: "/chat" }) || {};
  
  useEffect(() => {
    if (!chatId && chats.length && !loading && selectedAppId) {
      // Auto-select first chat when no chat is selected
      const firstChatId = chats[0]?.id;
      if (firstChatId) {
        navigate({ to: "/chat", search: { id: firstChatId }, replace: true });
      }
    }
  }, [chatId, chats, loading, navigate, selectedAppId]);

  // Don't render if not open
  if (!isOpen) return null;

  const getSizeIcon = () => {
    switch (size) {
      case "minimized":
        return <Maximize2 size={18} />;
      case "maximized":
        return <Minimize2 size={18} />;
      default:
        return <Maximize2 size={18} />;
    }
  };

  const getSizeLabel = () => {
    switch (size) {
      case "minimized":
        return "توسيع";
      case "maximized":
        return "تصغير";
      default:
        return "تكبير";
    }
  };

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 ${className}`}
         style={{
           boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12), 0 -2px 8px rgba(0, 0, 0, 0.08)'
         }}>
      {/* Enhanced Chat Header */}
      <div className="h-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-200 dark:border-blue-800 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="relative">
              <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-green-500 rounded-full shadow-sm"></div>
              <div className="absolute inset-0 w-3 h-3 bg-green-400 rounded-full animate-ping opacity-30"></div>
            </div>
            <MessageCircle size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="font-semibold text-gray-800 dark:text-gray-200">
              {size === "minimized" 
                ? "الدردشة" 
                : (
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <span>محادثة مع</span>
                    <Sparkles size={14} className="text-yellow-500" />
                    <span className="text-blue-600 dark:text-blue-400">Dyad AI</span>
                  </div>
                )
              }
            </span>
          </div>
          
          {size !== "minimized" && selectedAppId && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse px-2 py-1 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selectedAppId}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-1 rtl:space-x-reverse">
          {/* Size Toggle Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSize}
            className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            title={getSizeLabel()}
          >
            {getSizeIcon()}
          </Button>

          {/* Close Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-500 hover:text-red-600 transition-colors"
            title="إغلاق الدردشة"
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Chat Content */}
      {size !== "minimized" && (
        <div className="flex-1 overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
          {selectedAppId ? (
            <ChatContent 
              chatId={chatId} 
              selectedAppId={selectedAppId}
              isCompact={size === "normal"}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-center p-8">
              <div className="max-w-md">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl flex items-center justify-center">
                  <MessageCircle size={28} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-bold mb-3 text-gray-800 dark:text-gray-200">
                  اختر تطبيقاً للبدء
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  يرجى اختيار تطبيق من الشريط الجانبي لبدء محادثة مع الذكاء الاصطناعي
                </p>
                <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center justify-center space-x-2 rtl:space-x-reverse">
                    <Sparkles size={16} />
                    <span>ابدأ باختيار تطبيق أو إنشاء تطبيق جديد</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minimized Quick Actions */}
      {size === "minimized" && selectedAppId && (
        <div className="flex items-center justify-center py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleSize()}
            className="flex items-center space-x-3 rtl:space-x-reverse text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/20"
          >
            <MessageCircle size={16} />
            <span className="text-sm font-medium">اضغط للتوسيع والبدء في الدردشة</span>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          </Button>
        </div>
      )}
    </div>
  );
}