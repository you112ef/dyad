import React from "react";
import { FixedLayout } from "./FixedLayout";
import { WebAppSidebar } from "./WebAppSidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import { Toaster } from "sonner";

interface NewChatLayoutProps {
  children?: React.ReactNode;
}

export function NewChatLayout({ children }: NewChatLayoutProps) {
  return (
    <ThemeProvider>
      <div className="h-screen overflow-hidden bg-background">
        <div className="flex h-full">
          {/* Sidebar */}
          <WebAppSidebar />

          {/* Main Content with Fixed Layout */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <FixedLayout>{children}</FixedLayout>
          </div>
        </div>
        <Toaster richColors />
      </div>
    </ThemeProvider>
  );
}
