import { useState, useEffect } from "react";
import { IpcClient } from "@/ipc/ipc_client";

export function useLoadAppFile(appId: number | null, filePath: string | null) {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadFile = async () => {
      if (appId === null || filePath === null) {
        setContent(null);
        setError(null);
        return;
      }

      setLoading(true);
      try {
        // Try web API first
        let fileContent: string | null = null;
        try {
          const res = await fetch(
            `/api/files?appId=${appId}&path=${encodeURIComponent(filePath)}`,
          );
          if (res.ok) {
            const j = await res.json();
            fileContent = j?.content ?? "";
          }
        } catch {}
        if (fileContent === null) {
          const ipcClient = IpcClient.getInstance();
          fileContent = await ipcClient.readAppFile(appId, filePath);
        }

        setContent(fileContent);
        setError(null);
      } catch (error) {
        console.error(
          `Error loading file ${filePath} for app ${appId}:`,
          error,
        );
        setError(error instanceof Error ? error : new Error(String(error)));
        setContent(null);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [appId, filePath]);

  const refreshFile = async () => {
    if (appId === null || filePath === null) {
      return;
    }

    setLoading(true);
    try {
      let fileContent: string | null = null;
      try {
        const res = await fetch(
          `/api/files?appId=${appId}&path=${encodeURIComponent(filePath)}`,
        );
        if (res.ok) {
          const j = await res.json();
          fileContent = j?.content ?? "";
        }
      } catch {}
      if (fileContent === null) {
        const ipcClient = IpcClient.getInstance();
        fileContent = await ipcClient.readAppFile(appId, filePath);
      }
      setContent(fileContent);
      setError(null);
    } catch (error) {
      console.error(
        `Error refreshing file ${filePath} for app ${appId}:`,
        error,
      );
      setError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setLoading(false);
    }
  };

  return { content, loading, error, refreshFile };
}
