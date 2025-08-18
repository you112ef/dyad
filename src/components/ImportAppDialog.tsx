import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IpcClient } from "@/ipc/ipc_client";
import { useMutation } from "@tanstack/react-query";
import { showError, showSuccess } from "@/lib/toast";
import { Folder, X, Loader2, Info, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@radix-ui/react-label";
import { useNavigate } from "@tanstack/react-router";
import { useStreamChat } from "@/hooks/useStreamChat";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { selectedAppIdAtom } from "@/atoms/appAtoms";
import { useSetAtom } from "jotai";
import { useLoadApps } from "@/hooks/useLoadApps";
import { createDragDropHandlers, isFileSystemAccessSupported, getBrowserCompatibilityMessage, checkMinimumBrowserSupport, type FolderSelection } from "@/utils/webFileUtils";

interface ImportAppDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportAppDialog({ isOpen, onClose }: ImportAppDialogProps) {
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [hasAiRules, setHasAiRules] = useState<boolean | null>(null);
  const [customAppName, setCustomAppName] = useState<string>("");
  const [nameExists, setNameExists] = useState<boolean>(false);
  const [isCheckingName, setIsCheckingName] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragDropSupported] = useState<boolean>(true); // Drag and drop is widely supported
  const [fileSystemAccessSupported] = useState<boolean>(isFileSystemAccessSupported());
  const [browserSupport] = useState(() => checkMinimumBrowserSupport());
  const [compatibilityMessage] = useState(() => getBrowserCompatibilityMessage());
  const dialogRef = useRef<HTMLDivElement>(null);
  
  const navigate = useNavigate();
  const { streamMessage } = useStreamChat({ hasChatId: false });
  const { refreshApps } = useLoadApps();
  const setSelectedAppId = useSetAtom(selectedAppIdAtom);

  const checkAppName = async (name: string): Promise<void> => {
    setIsCheckingName(true);
    try {
      const result = await IpcClient.getInstance().checkAppName({
        appName: name,
      });
      setNameExists(result.exists);
    } catch (error: unknown) {
      showError("Failed to check app name: " + (error as any).toString());
    } finally {
      setIsCheckingName(false);
    }
  };

  const selectFolderMutation = useMutation({
    mutationFn: async () => {
      const result = await IpcClient.getInstance().selectAppFolder();
      if (!result.path || !result.name) {
        throw new Error("No folder selected");
      }
      const aiRulesCheck = await IpcClient.getInstance().checkAiRules({
        path: result.path,
      });
      setHasAiRules(aiRulesCheck.exists);
      setSelectedPath(result.path);

      // Use the folder name from the IPC response
      setCustomAppName(result.name);

      // Check if the app name already exists
      await checkAppName(result.name);

      return result;
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });

  const importAppMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPath) throw new Error("No folder selected");
      return IpcClient.getInstance().importApp({
        path: selectedPath,
        appName: customAppName,
      });
    },
    onSuccess: async (result) => {
      showSuccess(
        !hasAiRules
          ? "App imported successfully. Dyad will automatically generate an AI_RULES.md now."
          : "App imported successfully",
      );
      onClose();

      navigate({ to: "/chat", search: { id: result.chatId } });
      if (!hasAiRules) {
        streamMessage({
          prompt:
            "Generate an AI_RULES.md file for this app. Describe the tech stack in 5-10 bullet points and describe clear rules about what libraries to use for what.",
          chatId: result.chatId,
        });
      }
      setSelectedAppId(result.appId);
      await refreshApps();
    },
    onError: (error: Error) => {
      showError(error.message);
    },
  });

  const handleSelectFolder = () => {
    selectFolderMutation.mutate();
  };
  
  // Handle drag and drop
  const handleFilesDropped = async (selection: FolderSelection) => {
    try {
      // Store the selection temporarily
      const result = {
        path: selection.path,
        name: selection.name
      };
      
      setSelectedPath(result.path);
      setCustomAppName(result.name || '');
      
      // Check AI rules and app name
      const aiRulesCheck = await IpcClient.getInstance().checkAiRules({
        path: result.path
      });
      setHasAiRules(aiRulesCheck.exists);
      
      if (result.name) {
        await checkAppName(result.name);
      }
      
      setIsDragging(false);
    } catch (error: any) {
      showError(`Failed to process dropped files: ${error.message}`);
      setIsDragging(false);
    }
  };
  
  const handleDragError = (error: Error) => {
    showError(error.message);
    setIsDragging(false);
  };
  
  // Set up drag and drop handlers
  useEffect(() => {
    if (!dialogRef.current) return;
    
    const { handleDragOver, handleDragEnter, handleDragLeave, handleDrop } = createDragDropHandlers(
      handleFilesDropped,
      handleDragError
    );
    
    const element = dialogRef.current;
    
    const onDragEnter = (e: DragEvent) => {
      handleDragEnter(e);
      setIsDragging(true);
    };
    
    const onDragLeave = (e: DragEvent) => {
      handleDragLeave(e);
      // Only set dragging to false if we're leaving the dialog entirely
      if (!element.contains(e.relatedTarget as Node)) {
        setIsDragging(false);
      }
    };
    
    const onDrop = (e: DragEvent) => {
      handleDrop(e);
      setIsDragging(false);
    };
    
    element.addEventListener('dragover', handleDragOver);
    element.addEventListener('dragenter', onDragEnter);
    element.addEventListener('dragleave', onDragLeave);
    element.addEventListener('drop', onDrop);
    
    return () => {
      element.removeEventListener('dragover', handleDragOver);
      element.removeEventListener('dragenter', onDragEnter);
      element.removeEventListener('dragleave', onDragLeave);
      element.removeEventListener('drop', onDrop);
    };
  }, [isOpen]);

  const handleImport = () => {
    importAppMutation.mutate();
  };

  const handleClear = () => {
    setSelectedPath(null);
    setHasAiRules(null);
    setCustomAppName("");
    setNameExists(false);
    setIsDragging(false);
  };

  const handleAppNameChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newName = e.target.value;
    setCustomAppName(newName);
    if (newName.trim()) {
      await checkAppName(newName);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent ref={dialogRef} className={isDragging ? "ring-2 ring-blue-500 ring-offset-2" : ""}>
        <DialogHeader>
          <DialogTitle>Import App</DialogTitle>
          <DialogDescription>
            {fileSystemAccessSupported 
              ? "Select a folder or drag and drop your project folder here."
              : "Select files from your project folder or drag and drop them here."
            }
          </DialogDescription>
        </DialogHeader>

        {isDragging && (
          <div className="absolute inset-0 bg-blue-50/90 dark:bg-blue-950/90 flex items-center justify-center z-50 rounded-lg border-2 border-dashed border-blue-500">
            <div className="text-center">
              <Upload className="h-12 w-12 text-blue-500 mx-auto mb-2" />
              <p className="text-lg font-medium text-blue-600 dark:text-blue-400">Drop your project folder here</p>
              <p className="text-sm text-blue-500">Release to import your project</p>
            </div>
          </div>
        )}

        <Alert className="border-green-500/20 text-green-600 dark:text-green-400">
          <Info className="h-4 w-4" />
          <AlertDescription>
            Import your existing projects into Dyad to start collaborating with AI.
            {fileSystemAccessSupported 
              ? " You can browse for a folder or drag and drop it here."
              : " Select files or drag them here (folder structure will be preserved)."
            }
          </AlertDescription>
        </Alert>
        
        {!browserSupport.supported && (
          <Alert className="border-red-500/20 text-red-600 dark:text-red-400">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {browserSupport.message}
            </AlertDescription>
          </Alert>
        )}
        
        {browserSupport.supported && (
          <Alert className="border-blue-500/20 text-blue-600 dark:text-blue-400">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {compatibilityMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="py-4">
          {!selectedPath ? (
            <div className="space-y-4">
              <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging 
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50" 
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }`}>
                <Upload className={`h-12 w-12 mx-auto mb-4 ${
                  isDragging ? "text-blue-500" : "text-gray-400"
                }`} />
                <p className="text-lg font-medium mb-2">
                  {isDragging ? "Drop your project folder here" : "Drag & Drop Project Folder"}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  {fileSystemAccessSupported
                    ? "Drag a folder here or click the button below to browse"
                    : "Drag files here or click the button below to select files"
                  }
                </p>
                
                <Button
                  onClick={handleSelectFolder}
                  disabled={selectFolderMutation.isPending || isDragging || !browserSupport.supported}
                  variant="outline"
                  className="min-w-[140px]"
                >
                  {selectFolderMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Folder className="mr-2 h-4 w-4" />
                  )}
                  {selectFolderMutation.isPending
                    ? "Selecting..."
                    : fileSystemAccessSupported
                    ? "Browse Folder"
                    : "Select Files"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border p-4 bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">Selected folder:</p>
                    <p className="text-sm text-green-600 dark:text-green-300 break-all">
                      {selectedPath}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 w-8 p-0 flex-shrink-0 hover:bg-green-100 dark:hover:bg-green-900"
                    disabled={importAppMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Clear selection</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {nameExists && (
                  <p className="text-sm text-yellow-500">
                    An app with this name already exists. Please choose a
                    different name:
                  </p>
                )}
                <div className="relative">
                  <Label className="text-sm ml-2 mb-2">App name</Label>
                  <Input
                    value={customAppName}
                    onChange={handleAppNameChange}
                    placeholder="Enter new app name"
                    className="w-full pr-8"
                    disabled={importAppMutation.isPending}
                  />
                  {isCheckingName && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              {hasAiRules === false && (
                <Alert className="border-yellow-500/20 text-yellow-500 flex items-start gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 flex-shrink-0 mt-1" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          AI_RULES.md lets Dyad know which tech stack to use for
                          editing the app
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <AlertDescription>
                    No AI_RULES.md found. Dyad will automatically generate one
                    after importing.
                  </AlertDescription>
                </Alert>
              )}

              {importAppMutation.isPending && (
                <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground animate-pulse">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Importing app...</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={importAppMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={
              !selectedPath || importAppMutation.isPending || nameExists || !browserSupport.supported
            }
            className="min-w-[80px]"
          >
            {importAppMutation.isPending ? <>Importing...</> : "Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
