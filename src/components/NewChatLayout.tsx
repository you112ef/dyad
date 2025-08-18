import React from "react";
import { FixedLayout } from "./FixedLayout";
import { AppSidebar } from "./app-sidebar";
import { SidebarProvider } from "./ui/sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import { DeepLinkProvider } from "../contexts/DeepLinkContext";
import { Toaster } from "sonner";

interface NewChatLayoutProps {
  children?: React.ReactNode;
}

export function NewChatLayout({ children }: NewChatLayoutProps) {
  return (
    <ThemeProvider>
      <DeepLinkProvider>
        <div className="h-screen overflow-hidden bg-background">
          <SidebarProvider>
            <div className="flex h-full">
              {/* Sidebar */}
              <AppSidebar />
              
              {/* Main Content with Fixed Layout */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <FixedLayout>
                  {children}
                </FixedLayout>
              </div>
            </div>
          </SidebarProvider>
          <Toaster richColors />
        </div>
      </DeepLinkProvider>
    </ThemeProvider>
  );
}