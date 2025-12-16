import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  PanelLeftClose,
  PanelLeft,
  Plus,
  MessageSquare,
  Folder,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getProjectName, getTimeAgoShort } from "@/lib/format";
import { useSessions, useCreateSession, useDeleteSession } from "@/hooks";
import { CreateSessionDialog } from "@/components/sessions";
import { useEventsContext } from "@/providers/events-provider";
import type { Session } from "@opencode-ai/sdk/client";

const SIDEBAR_COLLAPSED_KEY = "opencode-sessions-sidebar-collapsed";

// Extend SDK Session type with optional timestamp fields
type SessionWithTimestamps = Session & {
  createdAt?: string;
  updatedAt?: string;
};

interface SessionsSidebarProps {
  /** @deprecated No longer needed - dialog handles project selection */
  currentDirectory?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function SessionsSidebar(_props: SessionsSidebarProps) {
  const navigate = useNavigate();
  const { id: currentSessionId } = useParams<{ id: string }>();
  const { data: sessions = [], isLoading } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const { sessionStatuses } = useEventsContext();

  // State for create session dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Load collapsed state from localStorage
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
    } catch {
      return false;
    }
  });

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
    } catch {
      // Ignore storage errors
    }
  }, [isCollapsed]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => !prev);
  }, []);

  // Sort sessions by updatedAt descending
  const sortedSessions = useMemo(() => {
    return [...(sessions as SessionWithTimestamps[])].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [sessions]);

  const handleCreateSession = useCallback(
    async ({ title, directory }: { title?: string; directory: string }) => {
      try {
        const newSession = await createSession.mutateAsync({
          title,
          directory,
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
            sortedSessions[currentIndex + 1] || sortedSessions[currentIndex - 1];

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
    },
    [navigate]
  );

  return (
    <div
      className={cn(
        "flex flex-col h-full border-r border-border bg-muted/30 transition-all duration-200",
        isCollapsed ? "w-12" : "w-64"
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setCreateDialogOpen(true)}
              disabled={createSession.isPending}
              title="New session"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleCollapsed}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto">
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
                    onClick={() => setCreateDialogOpen(true)}
                    disabled={createSession.isPending}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}
              />
              <TooltipContent side="right">New session</TooltipContent>
            </Tooltip>
            {sortedSessions.slice(0, 10).map((session) => {
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
                          session.id === currentSessionId ? "secondary" : "ghost"
                        }
                        size="icon"
                        className="h-8 w-8 relative"
                        onClick={() => handleSessionClick(session.id)}
                      >
                        {isBusy ? (
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  />
                  <TooltipContent side="right" className="flex flex-col gap-0.5">
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
        ) : (
          // Expanded view - full session list
          <div className="py-1">
            {isLoading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                Loading...
              </div>
            ) : sortedSessions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No sessions yet
              </div>
            ) : (
              sortedSessions.map((session) => (
                <SessionItem
                  key={session.id}
                  session={session}
                  isActive={session.id === currentSessionId}
                  isBusy={sessionStatuses.get(session.id)?.type === "busy"}
                  onClick={() => handleSessionClick(session.id)}
                  onDelete={(e) => handleDeleteSession(e, session.id)}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Create session dialog */}
      <CreateSessionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        showTrigger={false}
        onCreateSession={handleCreateSession}
        isLoading={createSession.isPending}
      />
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
}

function SessionItem({
  session,
  isActive,
  isBusy,
  onClick,
  onDelete,
}: SessionItemProps) {
  const displayTitle = session.title || `Session ${session.id.slice(0, 8)}`;
  const projectName = session.directory
    ? getProjectName(session.directory)
    : null;
  const updatedDate = session.updatedAt ? new Date(session.updatedAt) : null;
  const timeAgo = updatedDate ? getTimeAgoShort(updatedDate) : null;

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-start gap-2 px-3 py-2 text-left transition-colors",
        "hover:bg-secondary",
        isActive && "bg-secondary text-secondary-foreground"
      )}
    >
      {isBusy ? (
        <Loader2 className="h-4 w-4 shrink-0 mt-0.5 text-primary animate-spin" />
      ) : (
        <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium truncate">{displayTitle}</div>
        <div className="text-xs text-muted-foreground truncate">
          {projectName && (
            <span className="inline-flex items-center gap-1">
              <Folder className="h-3 w-3" />
              {projectName}
            </span>
          )}
          {projectName && timeAgo && <span className="mx-1">·</span>}
          {timeAgo && <span>{timeAgo}</span>}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
          "text-muted-foreground hover:text-destructive"
        )}
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
        <span className="sr-only">Delete session</span>
      </Button>
    </button>
  );
}
