import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getProjectName } from "@/lib/format";
import {
    useSessions,
    useCreateSession,
    useDeleteSession,
    useRenameSession
} from "@/hooks";
import { CreateSessionDialog } from "@/components/sessions";
import { RenameSessionDialog } from "@/components/chat/rename-session-dialog";
import { useEventsContext } from "@/providers/events-provider";
import { useUILayoutStore } from "@/stores";
import type { Session } from "@opencode-ai/sdk/client";
import type { SessionsSidebarProps, SessionGroup } from "./types";
import { SidebarHeader } from "./sidebar-header";
import { SidebarFooter } from "./sidebar-footer";
import { SearchInput } from "./search-input";
import { CollapsedSidebar } from "./collapsed-sidebar";
import { SessionGroup as SessionGroupComponent } from "./session-group";
import { SessionItem } from "./session-item";

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
    const [sessionToRename, setSessionToRename] = useState<Session | null>(
        null
    );

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
        return [...sessions].sort((a, b) => {
            const aTime = a.time.updated ?? a.time.created;
            const bTime = b.time.updated ?? b.time.created;
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

            const updateTime = session.time.updated ?? session.time.created;
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

    const handleRenameSession = useCallback((session: Session) => {
        setSessionToRename(session);
    }, []);

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
                !forceExpanded && (isCollapsed ? "w-12" : "w-80")
            )}
        >
            {/* Header */}
            <SidebarHeader
                isCollapsed={isCollapsed}
                forceExpanded={forceExpanded}
                isPending={createSession.isPending}
                onCreateClick={() => setCreateDialogOpen(true)}
                onToggleSidebar={toggleSessionsSidebar}
            />

            {/* Search input (only when expanded) */}
            {!isCollapsed && (
                <SearchInput value={searchQuery} onChange={setSearchQuery} />
            )}

            {/* Sessions list */}
            <ScrollArea className="flex-1">
                {isCollapsed ? (
                    <CollapsedSidebar
                        sessions={sortedSessions}
                        currentSessionId={currentSessionId}
                        sessionStatuses={sessionStatuses}
                        isPending={createSession.isPending}
                        onCreateClick={() => setCreateDialogOpen(true)}
                        onSessionClick={handleSessionClick}
                    />
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
