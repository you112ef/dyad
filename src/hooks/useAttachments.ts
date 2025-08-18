import { useState, useRef } from "react";

export function useAttachments() {
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setAttachments((attachments) => [...attachments, ...files]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set to false if we're leaving the container entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      // Filter out unsupported files (optional)
      const supportedFiles = files.filter(file => {
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        const supportedExtensions = [
          '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg',
          '.txt', '.md', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', 
          '.scss', '.sass', '.less', '.json', '.xml', '.csv', '.yml', 
          '.yaml', '.toml', '.ini', '.env', '.py', '.java', '.c', '.cpp', 
          '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', 
          '.kt', '.scala', '.sh', '.bat', '.ps1', '.sql', '.r', '.m', 
          '.mm', '.pl', '.lua', '.vim'
        ];
        return supportedExtensions.includes(extension);
      });
      
      if (supportedFiles.length !== files.length) {
        console.warn(`${files.length - supportedFiles.length} unsupported files were filtered out`);
      }
      
      setAttachments((attachments) => [...attachments, ...supportedFiles]);
    }
  };

  const clearAttachments = () => {
    setAttachments([]);
  };

  return {
    attachments,
    fileInputRef,
    isDraggingOver,
    handleAttachmentClick,
    handleFileChange,
    removeAttachment,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearAttachments,
  };
}
