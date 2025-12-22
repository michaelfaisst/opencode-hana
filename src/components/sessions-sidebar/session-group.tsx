import { ChevronDown, ChevronRight, Folder } from "lucide-react";
import { SessionItem } from "./session-item";
import type { SessionGroup as SessionGroupType } from "./types";
import type { Session } from "@opencode-ai/sdk/client";

interface SessionGroupProps {
    group: SessionGroupType;
    isCollapsed: boolean;
    onToggle: () => void;
    currentSessionId?: string;
    sessionStatuses: Map<string, { type: string }>;
    onSessionClick: (sessionId: string) => void;
    onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
    onRenameSession: (session: Session) => void;
}

export function SessionGroup({
    group,
    isCollapsed,
    onToggle,
    currentSessionId,
    sessionStatuses,
    onSessionClick,
    onDeleteSession,
    onRenameSession
}: SessionGroupProps) {
    return (
        <div className="mb-1">
            {/* Group header */}
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
            >
                {isCollapsed ? (
                    <ChevronRight className="h-3 w-3" />
                ) : (
                    <ChevronDown className="h-3 w-3" />
                )}
                <Folder className="h-3 w-3" />
                <span className="truncate flex-1 text-left">
                    {group.projectName}
                </span>
                <span className="text-[10px] text-muted-foreground/70">
                    {group.sessions.length}
                </span>
            </button>

            {/* Sessions in group */}
            {!isCollapsed && (
                <div className="ml-2">
                    {group.sessions.map((session) => (
                        <SessionItem
                            key={session.id}
                            session={session}
                            isActive={session.id === currentSessionId}
                            isBusy={
                                sessionStatuses.get(session.id)?.type === "busy"
                            }
                            onClick={() => onSessionClick(session.id)}
                            onDelete={(e) => onDeleteSession(e, session.id)}
                            onRename={() => onRenameSession(session)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
