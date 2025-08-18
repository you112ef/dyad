import React from "react";
import { NewChatLayout } from "../components/NewChatLayout";
import { useAtomValue } from "jotai";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { PreviewPanel } from "../components/preview_panel/PreviewPanel";

export default function NewChatPage() {
  const selectedAppId = useAtomValue(selectedAppIdAtom);

  return (
    <NewChatLayout>
      <div className="h-full flex">
        {/* Left Panel - App Information */}
        <div className="flex-1 p-6 overflow-auto">
          {selectedAppId ? (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">تطبيق {selectedAppId}</h1>
                <p className="text-muted-foreground">
                  إدارة وتطوير تطبيقك باستخدام الذكاء الاصطناعي
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl mb-3">🛠️</div>
                  <h3 className="text-lg font-semibold mb-2">إدارة الكود</h3>
                  <p className="text-sm text-muted-foreground">
                    تحرير وإنشاء ملفات الكود بمساعدة الذكاء الاصطناعي
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl mb-3">🎨</div>
                  <h3 className="text-lg font-semibold mb-2">تصميم الواجهة</h3>
                  <p className="text-sm text-muted-foreground">
                    إنشاء واجهات مستخدم جميلة وتفاعلية
                  </p>
                </div>

                <div className="bg-card border border-border rounded-lg p-6">
                  <div className="text-2xl mb-3">🚀</div>
                  <h3 className="text-lg font-semibold mb-2">النشر والتطوير</h3>
                  <p className="text-sm text-muted-foreground">
                    نشر التطبيق وإدارة الإصدارات المختلفة
                  </p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">النشاط الأخير</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">تم إنشاء ملف جديد: components/Button.tsx</span>
                    <span className="text-xs text-muted-foreground">منذ 5 دقائق</span>
                  </div>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm">تحديث التصميم الرئيسي</span>
                    <span className="text-xs text-muted-foreground">منذ 15 دقيقة</span>
                  </div>
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-sm">إصلاح خطأ في API</span>
                    <span className="text-xs text-muted-foreground">منذ ساعة</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-6">📱</div>
                <h2 className="text-2xl font-bold mb-4">اختر تطبيقاً للبدء</h2>
                <p className="text-muted-foreground max-w-md">
                  اختر تطبيقاً من الشريط الجانبي أو قم بإنشاء تطبيق جديد لبدء العمل
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </NewChatLayout>
  );
}