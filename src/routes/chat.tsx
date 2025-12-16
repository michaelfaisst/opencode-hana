import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { ChatContainer, SessionsSidebar } from "@/components/chat";
import { type SelectedModel } from "@/components/common";
import { Button } from "@/components/ui/button";
import { useSession, useMessages, useSendMessage, useAbortSession, useProviders, useSettings, SessionNotFoundError, type ImageAttachment, getWebSessionInfo } from "@/hooks";
import { useSessionStatusFromContext } from "@/providers";

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: providersData } = useProviders();
  const { settings } = useSettings();
  const [selectedModel, setSelectedModel] = useState<SelectedModel | undefined>(undefined);

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

  const { data: session, isLoading: isLoadingSession, error: sessionError } = useSession(id || "");
  const { data: messages = [], isLoading: isLoadingMessages } = useMessages(
    id || ""
  );
  const sendMessage = useSendMessage();
  const abortSession = useAbortSession();
  const { isBusy, isRetrying, status } = useSessionStatusFromContext(id || "");

  // Redirect to sessions list if session not found
  useEffect(() => {
    if (sessionError instanceof SessionNotFoundError) {
      navigate("/sessions", { replace: true });
    }
  }, [sessionError, navigate]);

  const handleSendMessage = async (text: string, images?: ImageAttachment[]) => {
    if (!id || !selectedModel) return;
    await sendMessage.mutateAsync({ sessionId: id, text, images, model: selectedModel, mode: settings.agentMode });
  };

  const handleAbort = async () => {
    if (!id) return;
    try {
      await abortSession.mutateAsync(id);
    } catch (error) {
      console.error("Failed to abort session:", error);
    }
  };

  // Handle "current" route - redirect to most recent session or sessions page
  if (id === "current") {
    // For now, just go to sessions page
    // Later we can track last active session in localStorage
    navigate("/sessions", { replace: true });
    return null;
  }

  if (!id) {
    navigate("/sessions", { replace: true });
    return null;
  }

  const title = session?.title || `Session ${id?.slice(0, 8) || ""}`;
  const sessionInfo = getWebSessionInfo(id);
  const currentDirectory = sessionInfo?.directory;

  return (
    <div className="flex h-screen flex-col">
      <Header
        title={title}
        leftContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 lg:hidden"
            onClick={() => navigate("/sessions")}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Back to sessions</span>
          </Button>
        }
      />
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <SessionsSidebar currentDirectory={currentDirectory} />
        </div>
        {/* Main chat area */}
        <div className="flex-1 overflow-hidden">
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
        </div>
      </div>
    </div>
  );
}
