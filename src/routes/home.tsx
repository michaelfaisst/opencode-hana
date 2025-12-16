import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MessageSquare, Plus } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ChatContainer, SessionsSidebar } from "@/components/chat";
import { CreateSessionDialog } from "@/components/sessions";
import { type SelectedModel } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  useSession,
  useSessions,
  useCreateSession,
  useMessages,
  useSendMessage,
  useAbortSession,
  useProviders,
  useSettings,
  SessionNotFoundError,
  type ImageAttachment,
} from "@/hooks";
import { useSessionStatusFromContext } from "@/providers";
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
  const { settings } = useSettings();
  const [selectedModel, setSelectedModel] = useState<SelectedModel | undefined>(
    undefined
  );

  // Fetch all sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useSessions();
  const createSession = useCreateSession();

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

  // Set the default model from settings or first available provider/model
  useEffect(() => {
    if (selectedModel || !providersData?.providers) return;

    // First, try to use the default model from settings
    if (settings.defaultModel) {
      // Verify the model still exists in providers
      const provider = providersData.providers.find(
        (p) => p.id === settings.defaultModel!.providerID
      );
      if (provider?.models?.[settings.defaultModel.modelID]) {
        setSelectedModel(settings.defaultModel);
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
  }, [providersData, selectedModel, settings.defaultModel]);

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
  const { isBusy, isRetrying, status } = useSessionStatusFromContext(
    activeSessionId || ""
  );

  // Handle session not found - navigate to root to auto-select another
  useEffect(() => {
    if (sessionError instanceof SessionNotFoundError) {
      navigate("/", { replace: true });
    }
  }, [sessionError, navigate]);

  const handleSendMessage = async (text: string, images?: ImageAttachment[]) => {
    if (!activeSessionId || !selectedModel) return;
    await sendMessage.mutateAsync({
      sessionId: activeSessionId,
      text,
      images,
      model: selectedModel,
      mode: settings.agentMode,
    });
  };

  const handleAbort = async () => {
    if (!activeSessionId) return;
    try {
      await abortSession.mutateAsync(activeSessionId);
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

  const title = session?.title || (activeSessionId ? `Session ${activeSessionId.slice(0, 8)}` : "OpenCode");
  const hasNoSessions = !isLoadingSessions && sortedSessions.length === 0;

  return (
    <div className="flex h-screen flex-col">
      <Header title={title} />
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
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
            />
          )}
        </div>
      </div>
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
