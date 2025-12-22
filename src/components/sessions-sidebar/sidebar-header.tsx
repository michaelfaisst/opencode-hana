import { PanelLeftClose, PanelLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarHeaderProps {
    isCollapsed: boolean;
    forceExpanded?: boolean;
    /** When true, show collapse button even if forceExpanded (for Allotment) */
    inAllotment?: boolean;
    isPending: boolean;
    onCreateClick: () => void;
    onToggleSidebar: () => void;
}

export function SidebarHeader({
    isCollapsed,
    forceExpanded,
    inAllotment,
    isPending,
    onCreateClick,
    onToggleSidebar
}: SidebarHeaderProps) {
    // Show collapse button unless forceExpanded without Allotment (mobile sheet)
    const showCollapseButton = inAllotment || !forceExpanded;

    return (
        <div className="flex items-center justify-between p-2 border-b border-border">
            {!isCollapsed && (
                <span className="text-sm font-medium text-foreground px-2">
                    Sessions
                </span>
            )}
            <div
                className={cn(
                    "flex items-center gap-1",
                    isCollapsed && "w-full justify-center"
                )}
            >
                {!isCollapsed && (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={onCreateClick}
                                    disabled={isPending}
                                >
                                    <Plus className="h-4 w-4" />
                                </Button>
                            }
                        />
                        <TooltipContent>New session</TooltipContent>
                    </Tooltip>
                )}
                {/* Show collapse button unless in mobile sheet (forceExpanded without Allotment) */}
                {showCollapseButton && (
                    <Tooltip>
                        <TooltipTrigger
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={onToggleSidebar}
                                >
                                    {isCollapsed ? (
                                        <PanelLeft className="h-4 w-4" />
                                    ) : (
                                        <PanelLeftClose className="h-4 w-4" />
                                    )}
                                </Button>
                            }
                        />
                        <TooltipContent side="right">
                            {isCollapsed
                                ? "Expand sidebar"
                                : "Collapse sidebar"}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        </div>
    );
}
