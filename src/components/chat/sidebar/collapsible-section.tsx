import { useCallback, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUILayoutStore } from "@/stores";

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
    contentClassName
}: CollapsibleSectionProps) {
    const { collapsedSections, setSectionCollapsed } = useUILayoutStore();

    // Local state for sections without storageKey
    const [localOpen, setLocalOpen] = useState(defaultOpen);

    // Determine if section is open
    // If we have a storage key, check the store; otherwise use local state
    const isOpen = storageKey
        ? !(collapsedSections[storageKey] ?? !defaultOpen)
        : localOpen;

    const handleToggle = useCallback(() => {
        if (storageKey) {
            setSectionCollapsed(storageKey, isOpen);
        } else {
            setLocalOpen((prev) => !prev);
        }
    }, [storageKey, isOpen, setSectionCollapsed]);

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
            {isOpen && <div className={cn(contentClassName)}>{children}</div>}
        </div>
    );
}
