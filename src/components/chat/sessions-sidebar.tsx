import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    PanelLeftClose,
    PanelLeft,
    Plus,
    MessageSquare,
    Folder,
    Trash2,
    Loader2,
    ChevronDown,
    ChevronRight,
    Search,
    X,
    Circle,
    Settings,
    MoreVertical,
    Pencil
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { getProjectName, getTimeAgoShort } from "@/lib/format";
import {
    useSessions,
    useCreateSession,
    useDeleteSession,
    useRenameSession
} from "@/hooks";
import { CreateSessionDialog } from "@/components/sessions";
import { RenameSessionDialog } from "@/components/chat";
import { useEventsContext } from "@/providers/events-provider";
import { useUILayoutStore } from "@/stores";
import type { Session } from "@opencode-ai/sdk/client";

// Extend SDK Session type with optional timestamp fields
type SessionWithTimestamps = Session & {
    createdAt?: string;
    updatedAt?: string;
};

interface SessionGroup {
    directory: string;
    projectName: string;
    sessions: SessionWithTimestamps[];
    mostRecentUpdate: number;
}

interface SessionsSidebarProps {
    /** @deprecated No longer needed - dialog handles project selection */
    currentDirectory?: string;
    /** When true, always renders expanded and hides collapse controls (for mobile sheet) */
    forceExpanded?: boolean;
    /** Called when a session is selected (for closing mobile sheet) */
    onSessionSelect?: () => void;
}

export function SessionsSidebar({
    forceExpanded,
    onSessionSelect
}: SessionsSidebarProps) {
    const navigate = useNavigate();
    const { id: currentSessionId } = useParams<{ id: string }>();
    const { data: sessions = [], isLoading } = useSessions();
    const createSession = useCreateSession();
    const deleteSession = useDeleteSession();
    const renameSession = useRenameSession();
    const { sessionStatuses, isConnected } = useEventsContext();

    // Extract OpenCode version from the first session (all sessions have the same version)
    const opencodeVersion = useMemo(() => {
        return sessions.length > 0 ? sessions[0].version : undefined;
    }, [sessions]);

    // State for create session dialog
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    // State for rename session dialog
    const [sessionToRename, setSessionToRename] =
        useState<SessionWithTimestamps | null>(null);

    // State for search
    const [searchQuery, setSearchQuery] = useState("");

    // State for collapsed groups (stored by directory path)
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(
        new Set()
    );

    // Use Zustand store for collapsed state
    const { sessionsSidebarCollapsed, toggleSessionsSidebar } =
        useUILayoutStore();

    // When forceExpanded is true, always render expanded
    const isCollapsed = forceExpanded ? false : sessionsSidebarCollapsed;

    // Sort sessions by updatedAt descending
    const sortedSessions = useMemo(() => {
        return [...(sessions as SessionWithTimestamps[])].sort((a, b) => {
            const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return bTime - aTime;
        });
    }, [sessions]);

    // Filter sessions by search query
    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return sortedSessions;

        const query = searchQuery.toLowerCase();
        return sortedSessions.filter((session) => {
            const title = (
                session.title || `Session ${session.id.slice(0, 8)}`
            ).toLowerCase();
            const projectName = session.directory
                ? getProjectName(session.directory).toLowerCase()
                : "";
            return title.includes(query) || projectName.includes(query);
        });
    }, [sortedSessions, searchQuery]);

    // Group sessions by project/directory
    const sessionGroups = useMemo(() => {
        // When searching, return flat list (no grouping)
        if (searchQuery.trim()) {
            return null;
        }

        const groups = new Map<string, SessionGroup>();

        for (const session of filteredSessions) {
            const directory = session.directory || "__uncategorized__";
            const projectName = session.directory
                ? getProjectName(session.directory)
                : "Uncategorized";

            if (!groups.has(directory)) {
                groups.set(directory, {
                    directory,
                    projectName,
                    sessions: [],
                    mostRecentUpdate: 0
                });
            }

            const group = groups.get(directory)!;
            group.sessions.push(session);

            const updateTime = session.updatedAt
                ? new Date(session.updatedAt).getTime()
                : 0;
            if (updateTime > group.mostRecentUpdate) {
                group.mostRecentUpdate = updateTime;
            }
        }

        // Sort groups by most recent update
        return Array.from(groups.values()).sort(
            (a, b) => b.mostRecentUpdate - a.mostRecentUpdate
        );
    }, [filteredSessions, searchQuery]);

    const toggleGroup = useCallback((directory: string) => {
        setCollapsedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(directory)) {
                next.delete(directory);
            } else {
                next.add(directory);
            }
            return next;
        });
    }, []);

    const handleCreateSession = useCallback(
        async ({ title, directory }: { title?: string; directory: string }) => {
            try {
                const newSession = await createSession.mutateAsync({
                    title,
                    directory
                });
                if (newSession?.id) {
                    navigate(`/sessions/${newSession.id}`);
                }
            } catch (error) {
                console.error("Failed to create session:", error);
            }
        },
        [createSession, navigate]
    );

    const handleDeleteSession = useCallback(
        async (e: React.MouseEvent, sessionId: string) => {
            e.stopPropagation();
            e.preventDefault();
            try {
                // If we're deleting the current session, find another session to navigate to
                if (sessionId === currentSessionId) {
                    // Find the next session to navigate to (prefer the one below, then above)
                    const currentIndex = sortedSessions.findIndex(
                        (s) => s.id === sessionId
                    );
                    const nextSession =
                        sortedSessions[currentIndex + 1] ||
                        sortedSessions[currentIndex - 1];

                    await deleteSession.mutateAsync(sessionId);

                    if (nextSession) {
                        navigate(`/sessions/${nextSession.id}`);
                    } else {
                        // No other sessions, go to home (will show empty state)
                        navigate("/");
                    }
                } else {
                    await deleteSession.mutateAsync(sessionId);
                }
            } catch (error) {
                console.error("Failed to delete session:", error);
            }
        },
        [deleteSession, currentSessionId, navigate, sortedSessions]
    );

    const handleSessionClick = useCallback(
        (sessionId: string) => {
            navigate(`/sessions/${sessionId}`);
            onSessionSelect?.();
        },
        [navigate, onSessionSelect]
    );

    const handleRenameSession = useCallback(
        (session: SessionWithTimestamps) => {
            setSessionToRename(session);
        },
        []
    );

    const handleRenameConfirm = useCallback(
        (newTitle: string) => {
            if (sessionToRename) {
                renameSession.mutate(
                    { id: sessionToRename.id, title: newTitle },
                    {
                        onSuccess: () => {
                            setSessionToRename(null);
                        }
                    }
                );
            }
        },
        [sessionToRename, renameSession]
    );

    return (
        <div
            className={cn(
                "flex flex-col h-full bg-muted/30 transition-all duration-200",
                forceExpanded ? "w-full" : "border-r border-border",
                !forceExpanded && (isCollapsed ? "w-12" : "w-64")
            )}
        >
            {/* Header */}
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
                                        onClick={() =>
                                            setCreateDialogOpen(true)
                                        }
                                        disabled={createSession.isPending}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                }
                            />
                            <TooltipContent>New session</TooltipContent>
                        </Tooltip>
                    )}
                    {/* Hide collapse toggle when forceExpanded */}
                    {!forceExpanded && (
                        <Tooltip>
                            <TooltipTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={toggleSessionsSidebar}
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

            {/* Search input (only when expanded) */}
            {!isCollapsed && (
                <div className="p-2 border-b border-border">
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                            type="text"
                            placeholder="Search sessions..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-8 pl-7 pr-7 text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Sessions list */}
            <ScrollArea className="flex-1">
                {isCollapsed ? (
                    // Collapsed view - just icons with tooltips
                    <div className="flex flex-col items-center py-2 gap-1">
                        <Tooltip>
                            <TooltipTrigger
                                render={(props) => (
                                    <Button
                                        {...props}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() =>
                                            setCreateDialogOpen(true)
                                        }
                                        disabled={createSession.isPending}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                )}
                            />
                            <TooltipContent side="right">
                                New session
                            </TooltipContent>
                        </Tooltip>
                        {sortedSessions.slice(0, 10).map((session) => {
                            const status = sessionStatuses.get(session.id);
                            const isBusy = status?.type === "busy";
                            const displayTitle =
                                session.title ||
                                `Session ${session.id.slice(0, 8)}`;
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
                                                    session.id ===
                                                    currentSessionId
                                                        ? "secondary"
                                                        : "ghost"
                                                }
                                                size="icon"
                                                className="h-8 w-8 relative"
                                                onClick={() =>
                                                    handleSessionClick(
                                                        session.id
                                                    )
                                                }
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
                                        <span className="font-medium">
                                            {displayTitle}
                                        </span>
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
                ) : (
                    // Expanded view - grouped session list
                    <div className="py-1">
                        {isLoading ? (
                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                Loading...
                            </div>
                        ) : filteredSessions.length === 0 ? (
                            <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                                {searchQuery
                                    ? "No matching sessions"
                                    : "No sessions yet"}
                            </div>
                        ) : sessionGroups ? (
                            // Grouped view
                            sessionGroups.map((group) => (
                                <SessionGroupComponent
                                    key={group.directory}
                                    group={group}
                                    isCollapsed={collapsedGroups.has(
                                        group.directory
                                    )}
                                    onToggle={() =>
                                        toggleGroup(group.directory)
                                    }
                                    currentSessionId={currentSessionId}
                                    sessionStatuses={sessionStatuses}
                                    onSessionClick={handleSessionClick}
                                    onDeleteSession={handleDeleteSession}
                                    onRenameSession={handleRenameSession}
                                />
                            ))
                        ) : (
                            // Flat view (when searching)
                            filteredSessions.map((session) => (
                                <SessionItem
                                    key={session.id}
                                    session={session}
                                    isActive={session.id === currentSessionId}
                                    isBusy={
                                        sessionStatuses.get(session.id)
                                            ?.type === "busy"
                                    }
                                    onClick={() =>
                                        handleSessionClick(session.id)
                                    }
                                    onDelete={(e) =>
                                        handleDeleteSession(e, session.id)
                                    }
                                    onRename={() =>
                                        handleRenameSession(session)
                                    }
                                />
                            ))
                        )}
                    </div>
                )}
            </ScrollArea>

            {/* Footer with connection status and version */}
            {!isCollapsed && (
                <SidebarFooter
                    isConnected={isConnected}
                    opencodeVersion={opencodeVersion}
                />
            )}

            {/* Create session dialog */}
            <CreateSessionDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                showTrigger={false}
                onCreateSession={handleCreateSession}
                isLoading={createSession.isPending}
            />

            {/* Rename session dialog */}
            <RenameSessionDialog
                open={!!sessionToRename}
                onOpenChange={(open) => !open && setSessionToRename(null)}
                currentTitle={sessionToRename?.title}
                onRename={handleRenameConfirm}
                isLoading={renameSession.isPending}
            />
        </div>
    );
}

// Session group component
interface SessionGroupComponentProps {
    group: SessionGroup;
    isCollapsed: boolean;
    onToggle: () => void;
    currentSessionId?: string;
    sessionStatuses: Map<string, { type: string }>;
    onSessionClick: (sessionId: string) => void;
    onDeleteSession: (e: React.MouseEvent, sessionId: string) => void;
    onRenameSession: (session: SessionWithTimestamps) => void;
}

function SessionGroupComponent({
    group,
    isCollapsed,
    onToggle,
    currentSessionId,
    sessionStatuses,
    onSessionClick,
    onDeleteSession,
    onRenameSession
}: SessionGroupComponentProps) {
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
                            compact
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// Compact session item for the sidebar
interface SessionItemProps {
    session: SessionWithTimestamps;
    isActive: boolean;
    isBusy?: boolean;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    onRename: () => void;
    compact?: boolean;
}

function SessionItem({
    session,
    isActive,
    isBusy,
    onClick,
    onDelete,
    onRename,
    compact
}: SessionItemProps) {
    const displayTitle = session.title || `Session ${session.id.slice(0, 8)}`;
    const projectName = session.directory
        ? getProjectName(session.directory)
        : null;
    const updatedDate = session.updatedAt ? new Date(session.updatedAt) : null;
    const timeAgo = updatedDate ? getTimeAgoShort(updatedDate) : null;

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
                {!compact && (
                    <div className="text-xs text-muted-foreground truncate">
                        {projectName && (
                            <span className="inline-flex items-center gap-1">
                                <Folder className="h-3 w-3" />
                                {projectName}
                            </span>
                        )}
                        {projectName && timeAgo && (
                            <span className="mx-1">·</span>
                        )}
                        {timeAgo && <span>{timeAgo}</span>}
                    </div>
                )}
                {compact && timeAgo && (
                    <div className="text-xs text-muted-foreground truncate">
                        {timeAgo}
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

// Sidebar footer with connection status and version info
interface SidebarFooterProps {
    isConnected: boolean;
    opencodeVersion?: string;
}

function SidebarFooter({ isConnected, opencodeVersion }: SidebarFooterProps) {
    const serverUrl =
        import.meta.env.VITE_OPENCODE_SERVER_URL || "localhost:4096";
    // Extract just the host part for display
    const displayUrl = serverUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

    return (
        <div className="border-t border-border p-2 space-y-2">
            {/* Connection status */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                    <Circle
                        className={cn(
                            "h-2 w-2 fill-current",
                            isConnected ? "text-green-500" : "text-destructive"
                        )}
                    />
                    <span
                        className={cn(
                            isConnected ? "text-green-500" : "text-destructive"
                        )}
                    >
                        {isConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Link to="/settings">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                >
                                    <Settings className="h-3 w-3" />
                                </Button>
                            </Link>
                        }
                    />
                    <TooltipContent>Settings</TooltipContent>
                </Tooltip>
            </div>

            {/* Server URL and versions */}
            <div className="text-[10px] text-muted-foreground space-y-0.5">
                <div className="truncate" title={serverUrl}>
                    {displayUrl}
                </div>
                <div className="flex items-center gap-2">
                    <span>Hana v{__APP_VERSION__}</span>
                    {opencodeVersion && (
                        <span>OpenCode v{opencodeVersion}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
