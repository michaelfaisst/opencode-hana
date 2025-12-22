import { Plus, MessageSquare, Loader2, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import { getProjectName } from "@/lib/format";
import type { Session } from "@opencode-ai/sdk/client";

interface CollapsedSidebarProps {
    sessions: Session[];
    currentSessionId?: string;
    sessionStatuses: Map<string, { type: string }>;
    isPending: boolean;
    onCreateClick: () => void;
    onSessionClick: (sessionId: string) => void;
}

export function CollapsedSidebar({
    sessions,
    currentSessionId,
    sessionStatuses,
    isPending,
    onCreateClick,
    onSessionClick
}: CollapsedSidebarProps) {
    return (
        <div className="flex flex-col items-center py-2 gap-1">
            <Tooltip>
                <TooltipTrigger
                    render={(props) => (
                        <Button
                            {...props}
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={onCreateClick}
                            disabled={isPending}
                        >
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                />
                <TooltipContent side="right">New session</TooltipContent>
            </Tooltip>
            {sessions.slice(0, 10).map((session) => {
                const status = sessionStatuses.get(session.id);
                const isBusy = status?.type === "busy";
                const displayTitle =
                    session.title || `Session ${session.id.slice(0, 8)}`;
                const projectName = session.directory
                    ? getProjectName(session.directory)
                    : null;
                return (
                    <Tooltip key={session.id}>
                        <TooltipTrigger
                            render={(props) => (
                                <Button
                                    {...props}
                                    variant={
                                        session.id === currentSessionId
                                            ? "secondary"
                                            : "ghost"
                                    }
                                    size="icon"
                                    className="h-8 w-8 relative"
                                    onClick={() => onSessionClick(session.id)}
                                >
                                    {isBusy ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                    ) : (
                                        <MessageSquare className="h-4 w-4" />
                                    )}
                                </Button>
                            )}
                        />
                        <TooltipContent
                            side="right"
                            className="flex flex-col gap-0.5"
                        >
                            <span className="font-medium">{displayTitle}</span>
                            {projectName && (
                                <span className="text-[10px] opacity-70 flex items-center gap-1">
                                    <Folder className="h-2.5 w-2.5" />
                                    {projectName}
                                </span>
                            )}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    );
}
