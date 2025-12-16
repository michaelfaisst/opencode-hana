import { useEffect, useRef } from "react";
import { File, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileMentionPopoverProps {
  isOpen: boolean;
  files: string[];
  isLoading: boolean;
  selectedIndex: number;
  onSelect: (file: string) => void;
  onClose: () => void;
}

export function FileMentionPopover({
  isOpen,
  files,
  isLoading,
  selectedIndex,
  onSelect,
  onClose,
}: FileMentionPopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: "nearest",
      });
    }
  }, [selectedIndex]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getFileName = (path: string) => {
    const parts = path.split("/");
    return parts[parts.length - 1];
  };

  const getDirectory = (path: string) => {
    const parts = path.split("/");
    if (parts.length <= 1) return "";
    return parts.slice(0, -1).join("/");
  };

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-80 max-h-64 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg bottom-full left-0 mb-2"
    >
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Files {files.length > 0 && `(${files.length})`}
        </span>
        {isLoading && files.length > 0 && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="max-h-48 overflow-y-auto">
        {isLoading && files.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
          </div>
        ) : files.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No files found
          </div>
        ) : (
          <div className="p-1">
            {files.map((file, index) => (
              <button
                key={file}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => onSelect(file)}
                className={cn(
                  "w-full flex items-start gap-2 px-2 py-1.5 text-left rounded-sm text-sm",
                  "hover:bg-accent hover:text-accent-foreground",
                  "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                  index === selectedIndex && "bg-accent text-accent-foreground"
                )}
              >
                <File className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate font-medium">{getFileName(file)}</span>
                  {getDirectory(file) && (
                    <span className="truncate text-xs text-muted-foreground">
                      {getDirectory(file)}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="p-2 border-t text-xs text-muted-foreground">
        <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd> navigate{" "}
        <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Enter</kbd> select{" "}
        <kbd className="px-1 py-0.5 bg-muted rounded text-[10px]">Esc</kbd> close
      </div>
    </div>
  );
}
