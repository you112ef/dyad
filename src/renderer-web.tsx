import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { WebIpcClient } from "./ipc/web_ipc_client";
import { NewChatLayout } from "./components/NewChatLayout";
import "./styles/globals.css";

// Initialize web client globally
const webClient = new WebIpcClient();
(window as any).webIpcClient = webClient;

// Simple web-only renderer without complex routing or Electron dependencies
function WebApp() {
  return (
    <StrictMode>
      <NewChatLayout>
        <div className="h-full flex items-center justify-center text-center">
          <div className="max-w-2xl mx-auto p-8">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">D</span>
            </div>
            <h1 className="text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">
              مرحباً بك في Dyad AI
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
              منصة تطوير التطبيقات بالذكاء الاصطناعي
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">💡</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  إنشاء تطبيقات ذكية
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  بناء تطبيقات متكاملة باستخدام الذكاء الاصطناعي
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">🛠️</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  إدارة الكود
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  تحرير وتطوير ملفات المشروع بسهولة
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-3xl mb-4">🎨</div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
                  تصميم الواجهات
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  إنشاء واجهات تفاعلية جميلة ومتجاوبة
                </p>
              </div>
            </div>

            <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h3 className="text-lg font-semibold mb-3 text-blue-900 dark:text-blue-100">
                🚀 عرض تجريبي للواجهة
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                يمكنك تجربة واجهة المستخدم والدردشة مع الذكاء الاصطناعي. اضغط
                على "فتح الدردشة" في الأعلى للبدء!
              </p>
            </div>
          </div>
        </div>
      </NewChatLayout>
    </StrictMode>
  );
}

// Initialize the app
const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<WebApp />);
} else {
  console.error("Root element not found");
}
