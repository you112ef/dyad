import { Paperclip } from "lucide-react";

interface DragDropOverlayProps {
  isDraggingOver: boolean;
}

export function DragDropOverlay({ isDraggingOver }: DragDropOverlayProps) {
  if (!isDraggingOver) return null;

  return (
    <div className="absolute inset-0 bg-blue-100/50 dark:bg-blue-900/50 flex items-center justify-center rounded-lg z-10 pointer-events-none backdrop-blur-sm">
      <div className="bg-background p-6 rounded-lg shadow-lg text-center border-2 border-dashed border-blue-500 animate-pulse">
        <Paperclip className="mx-auto mb-3 text-blue-500" size={32} />
        <p className="text-lg font-medium mb-2">Drop files to attach</p>
        <p className="text-sm text-muted-foreground">
          Supports images, code files, documents and more
        </p>
      </div>
    </div>
  );
}
