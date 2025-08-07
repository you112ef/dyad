import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "../contexts/ThemeContext";
import { DeepLinkProvider } from "../contexts/DeepLinkContext";
import { Toaster } from "sonner";
import { TitleBar } from "./TitleBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider>
        <DeepLinkProvider>
          <SidebarProvider>
            <TitleBar />
            <AppSidebar />
            <div className="flex min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-64px)] w-full overflow-x-hidden mt-10 sm:mt-12 mb-2 sm:mb-4 mr-2 sm:mr-4 border-t border-l border-border rounded-lg bg-background">
              {children}
            </div>
            <Toaster richColors />
          </SidebarProvider>
        </DeepLinkProvider>
      </ThemeProvider>
    </>
  );
}
