import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Command } from "@/hooks/use-commands";

interface CommandPopoverProps {
  isOpen: boolean;
  commands: Command[];
  isLoading?: boolean;
  selectedIndex: number;
  onSelect: (command: Command) => void;
  onClose: () => void;
}

export function CommandPopover({
  isOpen,
  commands,
  isLoading,
  selectedIndex,
  onSelect,
  onClose,
}: CommandPopoverProps) {
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

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 w-80 max-h-80 overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-lg bottom-full left-0 mb-2"
    >
      <div className="p-2 border-b flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          Commands {commands.length > 0 && `(${commands.length})`}
        </span>
        {isLoading && (
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="max-h-56 overflow-y-auto">
        {commands.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            No commands found
          </div>
        ) : (
          <div className="p-1">
            {commands.map((command, index) => {
              const Icon = command.icon;
              return (
                <button
                  key={command.name}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  onClick={() => onSelect(command)}
                  className={cn(
                    "w-full flex items-start gap-3 px-2 py-2 text-left rounded-sm",
                    "hover:bg-accent hover:text-accent-foreground",
                    "focus:bg-accent focus:text-accent-foreground focus:outline-none",
                    index === selectedIndex && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="shrink-0 mt-0.5 p-1 rounded bg-muted">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">/{command.name}</span>
                      {command.shortcut && (
                        <span className="text-xs text-muted-foreground">
                          {command.shortcut}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {command.description}
                    </span>
                  </div>
                </button>
              );
            })}
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
