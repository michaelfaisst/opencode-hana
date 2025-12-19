import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ChatContainer, SessionsSidebar, RenameSessionDialog, McpServersDialog } from "@/components/chat";
import { CreateSessionDialog } from "@/components/sessions";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  useSession,
  useSessions,
  useCreateSession,
  useDeleteSession,
  useRenameSession,
  useMessages,
  useSendMessage,
  useAbortSession,
  useProviders,
  useRevertSession,
  useUnrevertSession,
  useCompactSession,
  useSessionCommand,
  useCopySession,
  useExportSession,
  SessionNotFoundError,
  type ImageAttachment,
  type Command,
} from "@/hooks";
import { useSessionStatusFromContext } from "@/providers";
import { useSessionStore, useAppSettingsStore, useUILayoutStore } from "@/stores";
import type { Session } from "@opencode-ai/sdk/client";

// Extend SDK Session type with optional timestamp fields
type SessionWithTimestamps = Session & {
  createdAt?: string;
  updatedAt?: string;
};

export function HomePage() {
  const { id: urlSessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: providersData } = useProviders();

  // Zustand stores
  const { setSession } = useSessionStore();
  const {
    defaultModel,
    selectedModel,
    setSelectedModel,
    replaceSessionOnNew,
  } = useAppSettingsStore();
  const { 
    mobileSessionsSheetOpen, 
    setMobileSessionsSheetOpen,
    setMobileChatSheetOpen,
  } = useUILayoutStore();

  // Fetch all sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessions();
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  const renameSession = useRenameSession();

  // Rename dialog state
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  
  // MCP servers dialog state
  const [mcpDialogOpen, setMcpDialogOpen] = useState(false);

  // Sort sessions by updatedAt descending
  const sortedSessions = useMemo(() => {
    return [...(sessions as SessionWithTimestamps[])].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [sessions]);

  // Determine the active session ID
  const activeSessionId = useMemo(() => {
    // If URL has a session ID, use it
    if (urlSessionId) return urlSessionId;
    // Otherwise, auto-select the first session
    if (sortedSessions.length > 0) return sortedSessions[0].id;
    return null;
  }, [urlSessionId, sortedSessions]);

  // Auto-navigate to first session if we're at root and have sessions
  useEffect(() => {
    if (!urlSessionId && sortedSessions.length > 0 && !isLoadingSessions) {
      navigate(`/sessions/${sortedSessions[0].id}`, { replace: true });
    }
  }, [urlSessionId, sortedSessions, isLoadingSessions, navigate]);

  // Session data for active session
  const {
    data: session,
    isLoading: isLoadingSession,
    error: sessionError,
  } = useSession(activeSessionId || "");
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(
    activeSessionId || ""
  );
  const sendMessage = useSendMessage();
  const abortSession = useAbortSession();
  const { isBusy: isBusyFromSSE, isRetrying, status, setSessionIdle } = useSessionStatusFromContext(
    activeSessionId || ""
  );

  // Update the session store when session changes
  useEffect(() => {
    if (activeSessionId && session) {
      setSession(activeSessionId, session.directory);
    } else if (!activeSessionId) {
      setSession(null, null);
    }
  }, [activeSessionId, session, setSession]);

  // Determine busy state:
  // Trust the SSE status - show indicator from session start until session.idle event
  const isBusy = isBusyFromSSE;

  // Command hooks
  const revertSession = useRevertSession();
  const unrevertSession = useUnrevertSession();
  const compactSession = useCompactSession();
  const sessionCommand = useSessionCommand();
  const copySession = useCopySession();
  const exportSession = useExportSession();

  // Handle session not found - navigate to root to auto-select another
  useEffect(() => {
    if (sessionError instanceof SessionNotFoundError) {
      navigate("/", { replace: true });
    }
  }, [sessionError, navigate]);

  // Set the default model from settings or first available provider/model
  useEffect(() => {
    if (selectedModel || !providersData?.providers) return;

    // First, try to use the default model from settings
    if (defaultModel) {
      // Verify the model still exists in providers
      const provider = providersData.providers.find(
        (p) => p.id === defaultModel.providerID
      );
      if (provider?.models?.[defaultModel.modelID]) {
        setSelectedModel(defaultModel);
        return;
      }
    }

    // Fallback: use the first available provider/model
    const providers = providersData.providers;
    for (const provider of providers) {
      const models = Object.keys(provider.models || {});
      if (models.length > 0) {
        setSelectedModel({
          providerID: provider.id,
          modelID: models[0],
        });
        break;
      }
    }
  }, [providersData, selectedModel, defaultModel, setSelectedModel]);

  const handleSendMessage = async (text: string, images?: ImageAttachment[]) => {
    if (!activeSessionId || !selectedModel) return;
    // Get the current agentMode from the store at call time to ensure freshness
    const currentAgentMode = useAppSettingsStore.getState().agentMode;
    await sendMessage.mutateAsync({
      sessionId: activeSessionId,
      text,
      images,
      model: selectedModel,
      mode: currentAgentMode,
    });
  };

  const handleAbort = async () => {
    if (!activeSessionId) return;
    try {
      await abortSession.mutateAsync(activeSessionId);
      // Optimistically set the session to idle after successful abort
      // This prevents the message queue from holding messages if the SSE event is delayed
      setSessionIdle(activeSessionId);
    } catch (error) {
      console.error("Failed to abort session:", error);
    }
  };

  const handleCreateSession = async ({
    title,
    directory,
  }: {
    title?: string;
    directory: string;
  }) => {
    try {
      const newSession = await createSession.mutateAsync({ title, directory });
      if (newSession?.id) {
        navigate(`/sessions/${newSession.id}`);
      }
    } catch (error) {
      console.error("Failed to create session:", error);
    }
  };

  // Handle command execution
  const handleCommand = useCallback(async (command: Command) => {
    if (!activeSessionId) return;

    const directory = session?.directory;

    try {
      switch (command.name) {
        case "new": {
          if (!directory) {
            console.error("No directory found for session");
            return;
          }
          
          // Get the current session's title if we're replacing
          const currentTitle = session?.title;
          
          // If replaceSessionOnNew is enabled, delete the current session first
          if (replaceSessionOnNew) {
            await deleteSession.mutateAsync(activeSessionId);
          }
          
          // Create new session with same directory (and title if replacing)
          const newSession = await createSession.mutateAsync({ 
            title: replaceSessionOnNew ? currentTitle : undefined,
            directory 
          });
          if (newSession?.id) {
            navigate(`/sessions/${newSession.id}`);
          }
          break;
        }

        case "undo": {
          const lastAssistantMessage = [...messages]
            .reverse()
            .find((m) => m.info.role === "assistant");
          if (!lastAssistantMessage) {
            console.warn("No assistant message to revert");
            return;
          }
          await revertSession.mutateAsync({
            sessionId: activeSessionId,
            messageId: lastAssistantMessage.info.id,
          });
          break;
        }

        case "redo": {
          await unrevertSession.mutateAsync({ sessionId: activeSessionId });
          break;
        }

        case "review": {
          await sessionCommand.mutateAsync({
            sessionId: activeSessionId,
            command: "review",
          });
          break;
        }

        case "compact": {
          if (!selectedModel) {
            console.error("No model selected for compact");
            return;
          }
          await compactSession.mutateAsync({
            sessionId: activeSessionId,
            providerId: selectedModel.providerID,
            modelId: selectedModel.modelID,
          });
          break;
        }

        case "copy": {
          await copySession.mutateAsync({ sessionId: activeSessionId });
          break;
        }

        case "export": {
          await exportSession.mutateAsync({
            sessionId: activeSessionId,
            sessionTitle: session?.title,
          });
          break;
        }

        case "rename": {
          setRenameDialogOpen(true);
          break;
        }

        case "mcp": {
          setMcpDialogOpen(true);
          break;
        }

        default:
          console.warn(`Unknown command: ${command.name}`);
      }
    } catch (error) {
      console.error(`Failed to execute command ${command.name}:`, error);
    }
  }, [
    activeSessionId,
    messages,
    selectedModel,
    session,
    replaceSessionOnNew,
    navigate,
    createSession,
    deleteSession,
    revertSession,
    unrevertSession,
    compactSession,
    sessionCommand,
    copySession,
    exportSession,
  ]);

  // Handle session rename
  const handleRenameSession = useCallback(async (newTitle: string) => {
    if (!activeSessionId) return;
    try {
      await renameSession.mutateAsync({ id: activeSessionId, title: newTitle });
      setRenameDialogOpen(false);
    } catch (error) {
      console.error("Failed to rename session:", error);
    }
  }, [activeSessionId, renameSession]);

  const sessionTitle = session?.title || (activeSessionId ? `Session ${activeSessionId.slice(0, 8)}` : undefined);
  const hasNoSessions = !isLoadingSessions && sortedSessions.length === 0;

  return (
    <div className="flex h-screen flex-col">
      <Header 
        sessionTitle={sessionTitle}
        onOpenMobileSessionsSheet={() => setMobileSessionsSheetOpen(true)}
        onOpenMobileChatSheet={() => setMobileChatSheetOpen(true)}
      />
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <SessionsSidebar />
        </div>
        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {hasNoSessions ? (
            <EmptyState
              onCreateSession={handleCreateSession}
              isLoading={createSession.isPending}
            />
          ) : (
            <ChatContainer
              messages={messages}
              isLoadingMessages={isLoadingSession || isLoadingMessages}
              isSending={sendMessage.isPending}
              isBusy={isBusy}
              isRetrying={isRetrying}
              retryStatus={status.type === "retry" ? status : undefined}
              onSendMessage={handleSendMessage}
              onAbort={handleAbort}
              onCommand={handleCommand}
              autoFocusInput={messages.length === 0}
              sessionId={activeSessionId || undefined}
            />
          )}
        </div>
      </div>

      {/* Mobile sessions sheet */}
      <Sheet open={mobileSessionsSheetOpen} onOpenChange={setMobileSessionsSheetOpen}>
        <SheetContent side="left" className="w-64 max-w-[85vw] p-0" showCloseButton={false}>
          <SheetTitle className="sr-only">Sessions</SheetTitle>
          <SessionsSidebar 
            forceExpanded 
            onSessionSelect={() => setMobileSessionsSheetOpen(false)} 
          />
        </SheetContent>
      </Sheet>

      {/* Rename session dialog */}
      <RenameSessionDialog
        open={renameDialogOpen}
        onOpenChange={setRenameDialogOpen}
        currentTitle={session?.title}
        onRename={handleRenameSession}
        isLoading={renameSession.isPending}
      />

      {/* MCP servers dialog */}
      <McpServersDialog
        open={mcpDialogOpen}
        onOpenChange={setMcpDialogOpen}
      />
    </div>
  );
}

// Empty state when no sessions exist
interface EmptyStateProps {
  onCreateSession: (params: { title?: string; directory: string }) => void;
  isLoading?: boolean;
}

function EmptyState({ onCreateSession, isLoading }: EmptyStateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-6">
        <MessageSquare className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold mb-2">No sessions yet</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Create your first session to start chatting with OpenCode. Each session
        is tied to a project directory.
      </p>
      <Button onClick={() => setDialogOpen(true)} disabled={isLoading}>
        <Plus className="h-4 w-4 mr-2" />
        Create Session
      </Button>
      <CreateSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        showTrigger={false}
        onCreateSession={onCreateSession}
        isLoading={isLoading}
      />
    </div>
  );
}
