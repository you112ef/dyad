/**
 * Web-based file system utilities for handling file uploads, folder selection,
 * and file operations in browsers.
 */

declare global {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

export interface FileData {
  path: string;
  content: string | ArrayBuffer;
  file: File;
  type: 'text' | 'binary';
}

export interface FolderSelection {
  name: string;
  path: string;
  files: FileData[];
}

/**
 * Browser capability detection
 */
export interface BrowserCapabilities {
  fileSystemAccess: boolean;
  webkitDirectory: boolean;
  dragAndDrop: boolean;
  fileAPI: boolean;
}

/**
 * Check browser capabilities for file operations
 */
export function getBrowserCapabilities(): BrowserCapabilities {
  const input = document.createElement('input');
  
  return {
    fileSystemAccess: 'showDirectoryPicker' in window,
    webkitDirectory: 'webkitdirectory' in input,
    dragAndDrop: 'ondrop' in window,
    fileAPI: 'FileReader' in window
  };
}

/**
 * Check if the File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return getBrowserCapabilities().fileSystemAccess;
}

/**
 * Get user-friendly browser compatibility message
 */
export function getBrowserCompatibilityMessage(): string {
  const capabilities = getBrowserCapabilities();
  
  if (capabilities.fileSystemAccess) {
    return "Your browser supports full folder import with drag and drop.";
  } else if (capabilities.webkitDirectory && capabilities.dragAndDrop) {
    return "Your browser supports file import with drag and drop. Folder structure will be preserved.";
  } else if (capabilities.webkitDirectory) {
    return "Your browser supports file selection. You can select multiple files to import.";
  } else {
    return "Limited file support. You can select individual files to import.";
  }
}

/**
 * Check if browser meets minimum requirements
 */
export function checkMinimumBrowserSupport(): { supported: boolean; message: string } {
  const capabilities = getBrowserCapabilities();
  
  if (!capabilities.fileAPI) {
    return {
      supported: false,
      message: "Your browser doesn't support file reading. Please update to a modern browser."
    };
  }
  
  return {
    supported: true,
    message: "Your browser supports file import."
  };
}

/**
 * Select a folder using File System Access API (modern browsers)
 */
export async function selectFolderWithFileSystemAccess(): Promise<FolderSelection> {
  if (!window.showDirectoryPicker) {
    throw new Error('File System Access API not supported');
  }

  try {
    const dirHandle = await window.showDirectoryPicker();
    const files: FileData[] = [];
    
    await processDirectoryRecursive(dirHandle, '', files);
    
    const filteredFiles = files.filter(f => !shouldIgnoreFile(f.path));
    
    if (filteredFiles.length === 0) {
      throw new Error('No valid files found in the selected folder. Make sure it contains source code files.');
    }
    
    return {
      name: dirHandle.name,
      path: `/${dirHandle.name}`,
      files: filteredFiles
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Folder selection was cancelled');
    }
    if (error.name === 'NotAllowedError') {
      throw new Error('Permission denied. Please grant access to read the folder.');
    }
    if (error.name === 'SecurityError') {
      throw new Error('Security error. Cannot access this folder location.');
    }
    throw new Error(`Failed to select folder: ${error.message}`);
  }
}

/**
 * Process directory recursively to get all files
 */
async function processDirectoryRecursive(
  dirHandle: FileSystemDirectoryHandle, 
  basePath: string, 
  files: FileData[]
): Promise<void> {
  for await (const [name, handle] of dirHandle.entries()) {
    const currentPath = basePath ? `${basePath}/${name}` : name;
    
    if (handle.kind === 'file') {
      try {
        const file = await (handle as FileSystemFileHandle).getFile();
        const fileData = await processFile(file, currentPath);
        if (fileData) {
          files.push(fileData);
        }
      } catch (error) {
        console.warn(`Failed to read file ${currentPath}:`, error);
      }
    } else if (handle.kind === 'directory' && !shouldIgnoreDirectory(name)) {
      await processDirectoryRecursive(handle as FileSystemDirectoryHandle, currentPath, files);
    }
  }
}

/**
 * Fallback folder selection using file input with webkitdirectory
 */
export async function selectFolderWithFileInput(): Promise<FolderSelection> {
  const capabilities = getBrowserCapabilities();
  
  if (!capabilities.fileAPI) {
    throw new Error('Your browser does not support file reading. Please update to a modern browser.');
  }
  
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    
    if (capabilities.webkitDirectory) {
      input.webkitdirectory = true;
      input.multiple = true;
    } else {
      input.multiple = true;
      input.accept = '.js,.jsx,.ts,.tsx,.vue,.svelte,.py,.java,.c,.cpp,.h,.hpp,.rs,.go,.php,.rb,.html,.css,.scss,.json,.md,.txt';
    }
    
    const timeoutId = setTimeout(() => {
      reject(new Error('File selection timed out. Please try again.'));
    }, 300000); // 5 minute timeout
    
    input.onchange = async (e) => {
      clearTimeout(timeoutId);
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        reject(new Error('No files selected'));
        return;
      }

      try {
        const fileDataList: FileData[] = [];
        const errors: string[] = [];
        
        // Get folder name from the first file's path or use a default
        let folderName = 'Imported Project';
        if (files[0].webkitRelativePath) {
          folderName = files[0].webkitRelativePath.split('/')[0];
        } else if (files.length === 1) {
          folderName = files[0].name.replace(/\.[^/.]+$/, ''); // Remove extension
        }
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const relativePath = file.webkitRelativePath || file.name;
          
          if (shouldIgnoreFile(relativePath)) continue;
          
          try {
            const fileData = await processFile(file, relativePath);
            if (fileData) {
              fileDataList.push(fileData);
            }
          } catch (error: any) {
            errors.push(`Failed to process ${file.name}: ${error.message}`);
          }
        }
        
        if (fileDataList.length === 0) {
          const errorMsg = errors.length > 0 
            ? `No valid files found. Errors: ${errors.join(', ')}`
            : 'No valid files found. Please select source code files.';
          reject(new Error(errorMsg));
          return;
        }
        
        if (errors.length > 0) {
          console.warn('Some files could not be processed:', errors);
        }
        
        resolve({
          name: folderName,
          path: `/${folderName}`,
          files: fileDataList
        });
      } catch (error: any) {
        reject(new Error(`Failed to process files: ${error.message}`));
      }
    };
    
    input.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('File selection failed. Please try again.'));
    };
    
    input.oncancel = () => {
      clearTimeout(timeoutId);
      reject(new Error('File selection was cancelled'));
    };
    
    try {
      input.click();
    } catch (error: any) {
      clearTimeout(timeoutId);
      reject(new Error(`Failed to open file selector: ${error.message}`));
    }
  });
}

/**
 * Process a single file and return FileData
 */
async function processFile(file: File, path: string): Promise<FileData | null> {
  // Size limits
  const MAX_TEXT_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  const MAX_BINARY_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  
  const isTextFile = isTextFileType(file.name);
  const maxSize = isTextFile ? MAX_TEXT_FILE_SIZE : MAX_BINARY_FILE_SIZE;
  
  if (file.size > maxSize) {
    console.warn(`Skipping large ${isTextFile ? 'text' : 'binary'} file: ${path} (${(file.size / 1024 / 1024).toFixed(1)}MB)`);
    return null;
  }
  
  if (file.size === 0) {
    console.warn(`Skipping empty file: ${path}`);
    return null;
  }
  
  try {
    let content: string | ArrayBuffer;
    
    if (isTextFile) {
      content = await file.text();
      
      // Validate text content
      if (typeof content !== 'string') {
        throw new Error('Invalid text content');
      }
      
      // Check for binary content in text files
      if (content.includes('\0')) {
        console.warn(`File ${path} appears to be binary, skipping`);
        return null;
      }
    } else {
      content = await file.arrayBuffer();
      
      if (!content || content.byteLength === 0) {
        throw new Error('Failed to read file content');
      }
    }
    
    return {
      path,
      content,
      file,
      type: isTextFile ? 'text' : 'binary'
    };
  } catch (error: any) {
    console.warn(`Failed to read file ${path}: ${error.message}`);
    throw new Error(`Cannot read file ${file.name}: ${error.message}`);
  }
}

/**
 * Check if a file should be ignored during import
 */
function shouldIgnoreFile(path: string): boolean {
  try {
    const normalizedPath = path.toLowerCase();
    
    const ignoredPatterns = [
      // Dependencies
      /node_modules/,
      /vendor/,
      /third[_-]party/,
      
      // Version control
      /\.git/,
      /\.svn/,
      /\.hg/,
      
      // Build outputs
      /dist/,
      /build/,
      /out/,
      /target/,
      /\.next/,
      /\.nuxt/,
      /\.vuepress/,
      /_site/,
      /public/,
      
      // Test coverage
      /coverage/,
      /\.nyc_output/,
      /\.coverage/,
      
      // OS files
      /\.DS_Store/,
      /Thumbs\.db/,
      /desktop\.ini/,
      
      // Editor files
      /\.vscode/,
      /\.idea/,
      /\.sublime-/,
      
      // Temporary files
      /\.tmp$/,
      /\.temp$/,
      /\.swp$/,
      /\.swo$/,
      /~$/,
      /\.bak$/,
      /\.orig$/,
      
      // Environment files (sensitive)
      /\.env\.local$/,
      /\.env\.production$/,
      /\.env\.development$/,
      /\.env\.staging$/,
      /\.env\.test$/,
      
      // Lock files (large and auto-generated)
      /package-lock\.json$/,
      /yarn\.lock$/,
      /pnpm-lock\.yaml$/,
      /composer\.lock$/,
      /Pipfile\.lock$/,
      /poetry\.lock$/,
      /Cargo\.lock$/,
      
      // Other ignored patterns
      /\.pnp/,
      /\.cache/,
      /\.parcel-cache/,
      /\.firebase/,
      /\.vercel/,
      /\.netlify/,
      
      // Log files
      /\.log$/i,
      /\.out$/i,
      
      // Binary files that are commonly large
      /\.(exe|dll|so|dylib|bin|app|deb|rpm|msi|dmg|pkg)$/i,
      /\.(zip|tar|gz|rar|7z|bz2|xz)$/i,
      /\.(pdf|doc|docx|xls|xlsx|ppt|pptx)$/i,
      /\.(jpg|jpeg|png|gif|bmp|ico|tiff|webp|svg)$/i,
      /\.(mp4|avi|mov|wmv|flv|webm|mkv|mp3|wav|flac|ogg|m4a)$/i,
      /\.(woff|woff2|ttf|eot|otf)$/i
    ];
    
    return ignoredPatterns.some(pattern => pattern.test(normalizedPath));
  } catch (error) {
    console.warn(`Error checking if file should be ignored: ${path}`, error);
    return false; // If we can't determine, don't ignore it
  }
}

/**
 * Check if a directory should be ignored during import
 */
function shouldIgnoreDirectory(name: string): boolean {
  try {
    const normalizedName = name.toLowerCase();
    
    const ignoredDirs = [
      // Dependencies
      'node_modules',
      'vendor',
      'third_party',
      'third-party',
      'bower_components',
      
      // Version control
      '.git',
      '.svn',
      '.hg',
      '.bzr',
      
      // Build outputs
      'dist',
      'build',
      'out',
      'target',
      'bin',
      'obj',
      '.next',
      '.nuxt',
      '.vuepress',
      '_site',
      'public',
      
      // Test and coverage
      'coverage',
      '.nyc_output',
      '.coverage',
      '__pycache__',
      '.pytest_cache',
      '.tox',
      
      // Virtual environments
      'venv',
      '.venv',
      'env',
      '.env',
      'virtualenv',
      'ENV',
      
      // Editor and IDE
      '.vscode',
      '.idea',
      '.sublime-project',
      '.sublime-workspace',
      
      // OS specific
      '.ds_store',
      '__macosx',
      
      // Cache and temporary
      '.cache',
      '.tmp',
      '.temp',
      'tmp',
      'temp',
      '.parcel-cache',
      
      // Deployment
      '.firebase',
      '.vercel',
      '.netlify',
      
      // Other common ignored directories
      '.sass-cache',
      '.pnp',
      'logs'
    ];
    
    return ignoredDirs.includes(normalizedName);
  } catch (error) {
    console.warn(`Error checking if directory should be ignored: ${name}`, error);
    return false; // If we can't determine, don't ignore it
  }
}

/**
 * Determine if a file is a text file based on its extension
 */
function isTextFileType(filename: string): boolean {
  // Common text file extensions
  const textExtensions = [
    // Programming languages
    '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.py', '.java', '.c', '.cpp', '.cxx',
    '.h', '.hpp', '.hxx', '.rs', '.go', '.php', '.rb', '.swift', '.kt', '.scala', '.clj',
    '.hs', '.elm', '.ml', '.fs', '.vb', '.cs', '.dart', '.lua', '.pl', '.r', '.m',
    
    // Web technologies
    '.html', '.htm', '.css', '.scss', '.sass', '.less', '.styl', '.xml', '.svg',
    
    // Data formats
    '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.properties',
    
    // Documentation
    '.md', '.txt', '.rst', '.asciidoc', '.org',
    
    // Shell scripts
    '.sh', '.bash', '.zsh', '.fish', '.ps1', '.bat', '.cmd',
    
    // Config files
    '.dockerfile', '.gitignore', '.gitattributes', '.editorconfig', '.prettierrc',
    '.eslintrc', '.babelrc', '.npmrc', '.yarnrc', '.env', '.env.example', '.env.local',
    
    // Database
    '.sql', '.graphql', '.gql',
    
    // Serialization
    '.proto', '.thrift', '.avro',
    
    // Log files
    '.log',
    
    // Mobile development
    '.modulemap', '.xcconfig', '.plist', '.pbxproj', '.storyboard', '.xib',
    '.strings', '.stringsdict', '.entitlements', '.provisionprofile', '.mobileprovision',
    
    // Lock files (often text)
    '.lock'
  ];
  
  try {
    const ext = filename.toLowerCase().split('.').pop();
    if (!ext) return false;
    
    const fullExt = `.${ext}`;
    return textExtensions.includes(fullExt);
  } catch (error) {
    // If filename parsing fails, assume it's not a text file
    return false;
  }
}

/**
 * Check if a specific file exists in the file list
 */
export function fileExists(files: FileData[], filename: string): boolean {
  return files.some(f => {
    const fileName = f.path.split('/').pop();
    return fileName === filename;
  });
}

/**
 * Get file content by name
 */
export function getFileContent(files: FileData[], filename: string): string | null {
  const file = files.find(f => {
    const fileName = f.path.split('/').pop();
    return fileName === filename;
  });
  
  return file && file.type === 'text' ? file.content as string : null;
}

/**
 * Convert FileData array to a format suitable for storage
 */
export function serializeFiles(files: FileData[]): any[] {
  return files.map(f => ({
    path: f.path,
    content: f.type === 'text' ? f.content : btoa(String.fromCharCode(...new Uint8Array(f.content as ArrayBuffer))),
    type: f.type,
    size: f.file.size,
    lastModified: f.file.lastModified,
    name: f.file.name
  }));
}

/**
 * Handle drag and drop events for folder import
 */
export async function processDraggedFiles(items: DataTransferItemList): Promise<FolderSelection> {
  const capabilities = getBrowserCapabilities();
  
  if (!capabilities.dragAndDrop) {
    throw new Error('Drag and drop is not supported in your browser');
  }
  
  if (!capabilities.fileAPI) {
    throw new Error('File reading is not supported in your browser');
  }
  
  const files: FileData[] = [];
  const errors: string[] = [];
  let folderName = 'Dragged Folder';
  let processedCount = 0;
  
  try {
    // Process all dropped items
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      if (item.kind === 'file') {
        try {
          const entry = item.webkitGetAsEntry?.();
          
          if (entry && 'isDirectory' in entry && entry.isDirectory) {
            // It's a directory entry
            const dirEntry = entry as any;
            if (i === 0) folderName = dirEntry.name;
            await processDirectoryEntry(dirEntry, '', files);
            processedCount++;
          } else {
            // It's a file entry or regular file
            const file = item.getAsFile();
            if (file) {
              if (i === 0 && file.webkitRelativePath) {
                folderName = file.webkitRelativePath.split('/')[0];
              } else if (i === 0) {
                folderName = file.name.replace(/\.[^/.]+$/, '') || 'Dragged Files';
              }
              
              const relativePath = file.webkitRelativePath || file.name;
              if (!shouldIgnoreFile(relativePath)) {
                const fileData = await processFile(file, relativePath);
                if (fileData) {
                  files.push(fileData);
                }
              }
              processedCount++;
            }
          }
        } catch (error: any) {
          errors.push(`Item ${i + 1}: ${error.message}`);
        }
      }
    }
    
    if (processedCount === 0) {
      throw new Error('No files were found in the dropped items');
    }
    
    const filteredFiles = files.filter(f => !shouldIgnoreFile(f.path));
    
    if (filteredFiles.length === 0) {
      const errorMsg = errors.length > 0 
        ? `No valid files found. Errors encountered: ${errors.join(', ')}`
        : 'No valid source code files found in the dropped items';
      throw new Error(errorMsg);
    }
    
    if (errors.length > 0) {
      console.warn('Some items could not be processed:', errors);
    }
    
    return {
      name: folderName,
      path: `/${folderName}`,
      files: filteredFiles
    };
  } catch (error: any) {
    throw new Error(`Failed to process dropped files: ${error.message}`);
  }
}

/**
 * Process a directory entry from drag and drop
 */
async function processDirectoryEntry(
  dirEntry: any, 
  basePath: string, 
  files: FileData[]
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dirReader = dirEntry.createReader();
    
    function readEntries() {
      dirReader.readEntries(async (entries: any[]) => {
        if (entries.length === 0) {
          resolve();
          return;
        }
        
        try {
          for (const entry of entries) {
            const currentPath = basePath ? `${basePath}/${entry.name}` : entry.name;
            
            if (entry.isFile && !shouldIgnoreFile(currentPath)) {
              const file = await getFileFromEntry(entry);
              if (file) {
                const fileData = await processFile(file, currentPath);
                if (fileData) {
                  files.push(fileData);
                }
              }
            } else if (entry.isDirectory && !shouldIgnoreDirectory(entry.name)) {
              await processDirectoryEntry(entry, currentPath, files);
            }
          }
          
          // Continue reading if there might be more entries
          readEntries();
        } catch (error) {
          reject(error);
        }
      }, reject);
    }
    
    readEntries();
  });
}

/**
 * Convert a file entry to a File object
 */
function getFileFromEntry(fileEntry: any): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

/**
 * Create drag and drop event handlers
 */
export function createDragDropHandlers(
  onFilesDropped: (selection: FolderSelection) => void,
  onError: (error: Error) => void
) {
  const capabilities = getBrowserCapabilities();
  
  if (!capabilities.dragAndDrop) {
    console.warn('Drag and drop not supported in this browser');
    return {
      handleDragOver: () => {},
      handleDragEnter: () => {},
      handleDragLeave: () => {},
      handleDrop: () => onError(new Error('Drag and drop is not supported in your browser'))
    };
  }
  
  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'copy';
    }
  };
  
  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      if (!e.dataTransfer) {
        throw new Error('No data transfer object available');
      }
      
      if (!e.dataTransfer.items || e.dataTransfer.items.length === 0) {
        throw new Error('No files found in drop. Please drag files or folders.');
      }
      
      // Check if any of the items are files
      let hasFiles = false;
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        if (e.dataTransfer.items[i].kind === 'file') {
          hasFiles = true;
          break;
        }
      }
      
      if (!hasFiles) {
        throw new Error('No files found in drop. Please drag files or folders, not other content.');
      }
      
      const selection = await processDraggedFiles(e.dataTransfer.items);
      
      if (selection.files.length === 0) {
        throw new Error('No valid files found in the dropped items. Please drag a project folder with source code files.');
      }
      
      onFilesDropped(selection);
    } catch (error: any) {
      console.error('Drag and drop error:', error);
      onError(error instanceof Error ? error : new Error(`Drag and drop failed: ${String(error)}`));
    }
  };
  
  return {
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop
  };
}

/**
 * Main function to select a folder - tries File System Access API first, falls back to file input
 */
export async function selectFolder(): Promise<FolderSelection> {
  const browserSupport = checkMinimumBrowserSupport();
  if (!browserSupport.supported) {
    throw new Error(browserSupport.message);
  }
  
  if (isFileSystemAccessSupported()) {
    try {
      return await selectFolderWithFileSystemAccess();
    } catch (error) {
      // Fall back to file input if user cancelled or error occurred
      if (error instanceof Error && (error.message.includes('cancelled') || error.name === 'AbortError')) {
        throw error;
      }
      console.warn('File System Access API failed, falling back to file input:', error);
    }
  }
  
  try {
    return await selectFolderWithFileInput();
  } catch (error: any) {
    throw new Error(`File selection failed: ${error.message}`);
  }
}