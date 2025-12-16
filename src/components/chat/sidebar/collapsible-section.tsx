import { useState, useCallback } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "sidebar-section-";

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  storageKey?: string;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
}

export function CollapsibleSection({
  title,
  icon,
  badge,
  defaultOpen = true,
  storageKey,
  children,
  className,
  headerClassName,
  contentClassName,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (stored !== null) {
        return stored === "true";
      }
    }
    return defaultOpen;
  });

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      const newValue = !prev;
      if (storageKey) {
        localStorage.setItem(STORAGE_PREFIX + storageKey, String(newValue));
      }
      return newValue;
    });
  }, [storageKey]);

  return (
    <div className={cn("border-b border-border", className)}>
      <button
        onClick={handleToggle}
        className={cn(
          "w-full p-4 flex items-center gap-2",
          headerClassName
        )}
      >
        {isOpen ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
        )}
        <span className="shrink-0 text-muted-foreground">{icon}</span>
        <h3 className="text-sm font-medium">{title}</h3>
        {badge && <span className="ml-auto">{badge}</span>}
      </button>
      {isOpen && (
        <div className={cn(contentClassName)}>
          {children}
        </div>
      )}
    </div>
  );
}
