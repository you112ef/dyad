import { FileText, X } from "lucide-react";

interface AttachmentsListProps {
  attachments: File[];
  onRemove: (index: number) => void;
  onClearAll?: () => void;
}

export function AttachmentsList({
  attachments,
  onRemove,
  onClearAll,
}: AttachmentsListProps) {
  if (attachments.length === 0) return null;

  return (
    <div className="px-2 pt-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted-foreground font-medium">
          {attachments.length} file{attachments.length > 1 ? 's' : ''} attached
        </span>
        <button
          onClick={onClearAll || (() => attachments.forEach((_, index) => onRemove(index)))}
          className="text-xs text-red-500 hover:text-red-700 underline"
          title="Remove all attachments"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-1">
      {attachments.map((file, index) => (
        <div
          key={index}
          className="flex items-center bg-muted rounded-md px-2 py-1 text-xs gap-1"
          title={`${file.name} (${(file.size / 1024).toFixed(1)}KB)`}
        >
          {file.type.startsWith("image/") ? (
            <div className="relative group">
              <img
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="w-5 h-5 object-cover rounded"
                onLoad={(e) =>
                  URL.revokeObjectURL((e.target as HTMLImageElement).src)
                }
                onError={(e) =>
                  URL.revokeObjectURL((e.target as HTMLImageElement).src)
                }
              />
              <div className="absolute hidden group-hover:block top-6 left-0 z-10">
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="max-w-[200px] max-h-[200px] object-contain bg-white p-1 rounded shadow-lg"
                  onLoad={(e) =>
                    URL.revokeObjectURL((e.target as HTMLImageElement).src)
                  }
                />
              </div>
            </div>
          ) : (
            <FileText size={12} />
          )}
          <span className="truncate max-w-[120px]">{file.name}</span>
          <button
            onClick={() => onRemove(index)}
            className="hover:bg-muted-foreground/20 rounded-full p-0.5"
            aria-label="Remove attachment"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      </div>
    </div>
  );
}
