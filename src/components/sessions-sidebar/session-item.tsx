import {
    MessageSquare,
    Loader2,
    Trash2,
    MoreVertical,
    Pencil,
    Clock,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/format";
import { useAppSettingsStore } from "@/stores";
import type { Session } from "@opencode-ai/sdk/client";

interface SessionItemProps {
    session: Session;
    isActive: boolean;
    isBusy?: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onRename: () => void;
}

export function SessionItem({
    session,
    isActive,
    isBusy,
    onClick,
    onDelete,
    onRename
}: SessionItemProps) {
    const { showSessionTimestamps } = useAppSettingsStore();
    const displayTitle = session.title || `Session ${session.id.slice(0, 8)}`;
    const createdAt = formatTimestamp(session.time.created);
    const updatedAt = session.time.updated
        ? formatTimestamp(session.time.updated)
        : null;

    return (
        <div
            className={cn(
                "group w-full flex items-center gap-2 px-3 py-2 text-left transition-colors cursor-pointer",
                "hover:bg-secondary",
                isActive && "bg-secondary text-secondary-foreground"
            )}
            onClick={onClick}
        >
            {isBusy ? (
                <Loader2 className="h-4 w-4 shrink-0 text-primary animate-spin" />
            ) : (
                <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                    {displayTitle}
                </div>
                {showSessionTimestamps && (
                    <div className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-2 truncate">
                            <Tooltip>
                                <TooltipTrigger
                                    render={
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3 w-3 shrink-0" />
                                            {createdAt}
                                        </span>
                                    }
                                />
                                <TooltipContent>Created at</TooltipContent>
                            </Tooltip>
                            {updatedAt && (
                                <>
                                    <span>·</span>
                                    <Tooltip>
                                        <TooltipTrigger
                                            render={
                                                <span className="flex items-center gap-1">
                                                    <RefreshCw className="h-3 w-3 shrink-0" />
                                                    {updatedAt}
                                                </span>
                                            }
                                        />
                                        <TooltipContent>
                                            Updated at
                                        </TooltipContent>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
            <DropdownMenu>
                <DropdownMenuTrigger
                    render={
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                                "text-muted-foreground hover:text-foreground"
                            )}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <MoreVertical className="h-3 w-3" />
                            <span className="sr-only">Session options</span>
                        </Button>
                    }
                />
                <DropdownMenuContent align="end" side="bottom">
                    <DropdownMenuItem
                        onClick={(e) => {
                            e.stopPropagation();
                            onRename();
                        }}
                    >
                        <Pencil className="h-3 w-3" />
                        Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onClick={onDelete}>
                        <Trash2 className="h-3 w-3" />
                        Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
