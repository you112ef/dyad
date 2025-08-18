import React, { useState, useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { useLoadAppFile } from "@/hooks/useLoadAppFile";
import { useTheme } from "@/contexts/ThemeContext";
import { ChevronRight, Circle } from "lucide-react";
import "@/components/chat/monaco";
import { IpcClient } from "@/ipc/ipc_client";
import { useSettings } from "@/hooks/useSettings";
import { showError } from "@/lib/toast";

interface FileEditorProps {
  appId: number | null;
  filePath: string;
}

interface BreadcrumbProps {
  path: string;
  hasUnsavedChanges: boolean;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ path, hasUnsavedChanges }) => {
  const segments = path.split("/").filter(Boolean);

  return (
    <div className="flex items-center justify-between px-4 py-2 text-sm text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-1 overflow-hidden">
        <div className="flex items-center gap-1 overflow-hidden min-w-0">
          {segments.map((segment, index) => (
            <React.Fragment key={index}>
              {index > 0 && (
                <ChevronRight
                  size={14}
                  className="text-gray-400 flex-shrink-0"
                />
              )}
              <span className="hover:text-gray-900 dark:hover:text-gray-100 cursor-pointer truncate">
                {segment}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className="flex-shrink-0 ml-2">
          {hasUnsavedChanges && (
            <Circle
              size={8}
              fill="currentColor"
              className="text-amber-600 dark:text-amber-400"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export const FileEditor = ({ appId, filePath }: FileEditorProps) => {
  const { content, loading, error } = useLoadAppFile(appId, filePath);
  const { theme } = useTheme();
  const { settings } = useSettings();
  const [value, setValue] = useState<string | undefined>(undefined);
  const [displayUnsavedChanges, setDisplayUnsavedChanges] = useState(false);

  // Use refs for values that need to be current in event handlers
  const originalValueRef = useRef<string | undefined>(undefined);
  const editorRef = useRef<any>(null);
  const isSavingRef = useRef<boolean>(false);
  const needsSaveRef = useRef<boolean>(false);
  const currentValueRef = useRef<string | undefined>(undefined);

  // Update state when content loads
  useEffect(() => {
    if (content !== null) {
      setValue(content);
      originalValueRef.current = content;
      currentValueRef.current = content;
      needsSaveRef.current = false;
      setDisplayUnsavedChanges(false);
    }
  }, [content, filePath]);

  // Sync the UI with the needsSave ref
  useEffect(() => {
    setDisplayUnsavedChanges(needsSaveRef.current);
  }, [needsSaveRef.current]);

  // Determine if dark mode based on theme
  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const editorTheme = isDarkMode ? "dyad-dark" : "dyad-light";

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;

    // Listen for model content change events
    editor.onDidBlurEditorText(() => {
      console.log("Editor text blurred, checking if save needed");
      if (needsSaveRef.current) {
        saveFile();
      }
    });
  };

  // Handle content change
  const handleEditorChange = (newValue: string | undefined) => {
    setValue(newValue);
    currentValueRef.current = newValue;

    const hasChanged = newValue !== originalValueRef.current;
    needsSaveRef.current = hasChanged;
    setDisplayUnsavedChanges(hasChanged);
  };

  // Save the file
  const saveFile = async () => {
    if (
      !appId ||
      currentValueRef.current === undefined ||
      !needsSaveRef.current ||
      isSavingRef.current
    )
      return;

    try {
      isSavingRef.current = true;

      // Prefer web API when available
      try {
        const res = await fetch("/api/files", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            appId,
            path: filePath,
            content: currentValueRef.current,
          }),
        });
        if (!res.ok) throw new Error(`Failed to save via API: ${res.status}`);
      } catch (e) {
        // Fallback to IPC (desktop)
        const ipcClient = IpcClient.getInstance();
        await ipcClient.editAppFile(appId, filePath, currentValueRef.current);
      }

      originalValueRef.current = currentValueRef.current;
      needsSaveRef.current = false;
      setDisplayUnsavedChanges(false);
    } catch (error) {
      showError(error);
    } finally {
      isSavingRef.current = false;
    }
  };

  // Determine language based on file extension
  const getLanguage = (filePath: string) => {
    const extension = filePath.split(".").pop()?.toLowerCase() || "";
    const languageMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      html: "html",
      css: "css",
      json: "json",
      md: "markdown",
      py: "python",
      java: "java",
      c: "c",
      cpp: "cpp",
      cs: "csharp",
      go: "go",
      rs: "rust",
      rb: "ruby",
      php: "php",
      swift: "swift",
      kt: "kotlin",
      // Add more as needed
    };

    return languageMap[extension] || "plaintext";
  };

  if (loading) {
    return <div className="p-4">Loading file content...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error.message}</div>;
  }

  if (!content) {
    return <div className="p-4 text-gray-500">No content available</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <Breadcrumb path={filePath} hasUnsavedChanges={displayUnsavedChanges} />
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage={getLanguage(filePath)}
          value={value}
          theme={editorTheme}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: true },
            scrollBeyondLastLine: false,
            wordWrap: "on",
            automaticLayout: true,
            fontFamily: "monospace",
            fontSize: 13,
            lineNumbers: "on",
            readOnly: !settings?.experiments?.enableFileEditing,
          }}
        />
      </div>
    </div>
  );
};
