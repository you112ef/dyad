import React, { useState, useEffect } from "react";
import { useAtom } from "jotai";
import { MessageSquare, X, Maximize2, Minimize2, Settings, Palette } from "lucide-react";
import { SlidingChatPanel } from "./SlidingChatPanel";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { PreviewPanel } from "./preview_panel/PreviewPanel";
import { Button } from "./ui/button";

interface FixedLayoutProps {
  children?: React.ReactNode;
}

export function FixedLayout({ children }: FixedLayoutProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatSize, setChatSize] = useState<"minimized" | "normal" | "maximized">("normal");
  const [selectedAppId] = useAtom(selectedAppIdAtom);
  const [showPreview, setShowPreview] = useState(true);

  // Auto-open chat when app is selected
  useEffect(() => {
    if (selectedAppId && !isChatOpen) {
      setIsChatOpen(true);
    }
  }, [selectedAppId, isChatOpen]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
    if (!isChatOpen) {
      setChatSize("normal");
    }
  };

  const toggleChatSize = () => {
    if (chatSize === "normal") {
      setChatSize("maximized");
    } else if (chatSize === "maximized") {
      setChatSize("minimized");
    } else {
      setChatSize("normal");
    }
  };

  const getChatHeight = () => {
    switch (chatSize) {
      case "minimized":
        return "h-16";
      case "maximized":
        return "h-[calc(100vh-8rem)]";
      default:
        return "h-96";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-background to-muted/20">
      {/* Fixed Header with gradient */}
      <div className="h-16 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm flex items-center justify-between px-6 z-50">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">D</span>
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 bg-clip-text text-transparent">
              Dyad AI
            </h1>
          </div>
          
          {selectedAppId && (
            <div className="flex items-center space-x-2 rtl:space-x-reverse px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                التطبيق: {selectedAppId}
              </span>
            </div>
          )}
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

          {/* Chat Toggle Button with enhanced styling */}
          <Button
            onClick={toggleChat}
            size="sm"
            className={`transition-all duration-200 ${
              isChatOpen
                ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md"
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
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - App Content */}
        <div className={`${showPreview ? 'flex-1' : 'w-full'} flex flex-col transition-all duration-300`}>
          <div className="flex-1 p-6 overflow-auto">
            {children ? (
              <div className="max-w-6xl mx-auto">
                {children}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl flex items-center justify-center">
                    <MessageSquare size={32} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">
                    مرحباً بك في Dyad AI
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    اختر تطبيقاً من الشريط الجانبي أو ابدأ محادثة جديدة مع الذكاء الاصطناعي لتطوير تطبيقاتك
                  </p>
                  
                  <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl mb-2">💡</div>
                      <div className="font-medium mb-1">إنشاء تطبيقات</div>
                      <div className="text-gray-500 dark:text-gray-400">بناء تطبيقات متكاملة</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl mb-2">🛠️</div>
                      <div className="font-medium mb-1">إدارة الكود</div>
                      <div className="text-gray-500 dark:text-gray-400">تحرير وتطوير الملفات</div>
                    </div>
                    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div className="text-2xl mb-2">🎨</div>
                      <div className="font-medium mb-1">تصميم الواجهات</div>
                      <div className="text-gray-500 dark:text-gray-400">واجهات تفاعلية جميلة</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Preview (collapsible) */}
        {showPreview && (
          <div className="w-1/2 border-l border-border/50 bg-white dark:bg-gray-900 transition-all duration-300">
            <div className="h-full flex flex-col">
              <div className="h-12 border-b border-border/50 flex items-center justify-between px-4 bg-gray-50 dark:bg-gray-800">
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
              <div className="flex-1">
                <PreviewPanel />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Sliding Chat Panel */}
      <SlidingChatPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        size={chatSize}
        onToggleSize={toggleChatSize}
        className={`${getChatHeight()} transition-all duration-300 ease-out border-t-2 border-blue-200 dark:border-blue-800 shadow-2xl`}
      />

      {/* Enhanced Floating Chat Button */}
      {!isChatOpen && selectedAppId && (
        <div className="fixed bottom-8 right-8 z-40">
          <Button
            onClick={() => setIsChatOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 group"
          >
            <MessageSquare size={24} className="group-hover:scale-110 transition-transform" />
            <span className="sr-only">فتح الدردشة</span>
          </Button>
          
          {/* Notification indicator */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
    </div>
  );
}