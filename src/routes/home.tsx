import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Allotment, type AllotmentHandle } from "allotment";
import { MessageSquare, Plus } from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/layout/header";
import {
    ChatContainer,
    ChatSidebar,
    RenameSessionDialog,
    McpServersDialog
} from "@/components/chat";
import { SessionsSidebar } from "@/components/sessions-sidebar";
import { CreateSessionDialog } from "@/components/sessions";
import { ErrorBoundary } from "@/components/common";
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
    useIsDesktop,
    SessionNotFoundError,
    type ImageAttachment,
    type Command
} from "@/hooks";
import { useSessionStatusFromContext } from "@/providers";
import {
    useSessionStore,
    useAppSettingsStore,
    useUILayoutStore
} from "@/stores";
import type { Session } from "@opencode-ai/sdk/client";

// Minimum and maximum sizes for sidebars (in pixels)
const SESSIONS_SIDEBAR_MIN = 48;
const SESSIONS_SIDEBAR_MAX = 500;
const CHAT_SIDEBAR_MIN = 40;
const CHAT_SIDEBAR_MAX = 500;

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
        replaceSessionOnNew
    } = useAppSettingsStore();
    const {
        mobileSessionsSheetOpen,
        setMobileSessionsSheetOpen,
        setMobileChatSheetOpen,
        sessionsSidebarWidth,
        chatSidebarWidth,
        setSessionsSidebarWidth,
        setChatSidebarWidth
    } = useUILayoutStore();

    // Check if we're on desktop (for Allotment layout)
    const isDesktop = useIsDesktop();

    // Ref for Allotment to handle resize
    const allotmentRef = useRef<AllotmentHandle>(null);

    // Track current pane sizes for detecting collapsed state
    const [paneSizes, setPaneSizes] = useState<number[]>([
        sessionsSidebarWidth,
        0, // main content - will be calculated by Allotment
        chatSidebarWidth
    ]);

    // Determine if sidebars are collapsed based on current pane sizes
    const isSessionsSidebarCollapsed =
        paneSizes[0] <= SESSIONS_SIDEBAR_MIN + 10; // 10px tolerance
    const isChatSidebarCollapsed = paneSizes[2] <= CHAT_SIDEBAR_MIN + 10;

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
        error: sessionError
    } = useSession(activeSessionId || "");
    const { data: messages = [], isLoading: isLoadingMessages } = useMessages(
        activeSessionId || ""
    );
    const sendMessage = useSendMessage();
    const abortSession = useAbortSession();
    const {
        isBusy: isBusyFromSSE,
        isRetrying,
        status,
        setSessionIdle
    } = useSessionStatusFromContext(activeSessionId || "");

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

    // Get context limit for the selected model (for ChatSidebar when rendered separately)
    const contextLimit = useMemo(() => {
        if (!selectedModel || !providersData?.providers) return undefined;

        const provider = providersData.providers.find(
            (p) => p.id === selectedModel.providerID
        );
        if (!provider?.models) return undefined;

        const model = provider.models[selectedModel.modelID] as
            | {
                  limit?: { context?: number };
              }
            | undefined;

        return model?.limit?.context;
    }, [selectedModel, providersData]);

    // Convert messages to format expected by ChatSidebar
    const sidebarMessages = useMemo(() => {
        return messages.map((m) => ({
            role: m.info.role,
            parts: m.parts,
            tokens: (
                m.info as {
                    tokens?: {
                        input: number;
                        output: number;
                        reasoning: number;
                        cache: { read: number; write: number };
                    };
                }
            ).tokens,
            cost: (m.info as { cost?: number }).cost
        }));
    }, [messages]);

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
                    modelID: models[0]
                });
                break;
            }
        }
    }, [providersData, selectedModel, defaultModel, setSelectedModel]);

    const handleSendMessage = async (
        text: string,
        images?: ImageAttachment[]
    ) => {
        if (!activeSessionId || !selectedModel) return;
        // Get the current state from the store at call time to ensure freshness
        const state = useAppSettingsStore.getState();
        const currentAgentMode = state.agentMode;
        const customSystemPrompt = state.assistantPersona.customSystemPrompt;
        try {
            await sendMessage.mutateAsync({
                sessionId: activeSessionId,
                text,
                images,
                model: selectedModel,
                mode: currentAgentMode,
                systemPrompt: customSystemPrompt || undefined
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to send message";
            toast.error(message);
        }
    };

    const handleAbort = async () => {
        if (!activeSessionId) return;
        try {
            await abortSession.mutateAsync(activeSessionId);
            // Optimistically set the session to idle after successful abort
            // This prevents the message queue from holding messages if the SSE event is delayed
            setSessionIdle(activeSessionId);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to abort session";
            toast.error(message);
        }
    };

    const handleCreateSession = async ({
        title,
        directory
    }: {
        title?: string;
        directory: string;
    }) => {
        try {
            const newSession = await createSession.mutateAsync({
                title,
                directory
            });
            if (newSession?.id) {
                navigate(`/sessions/${newSession.id}`);
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Failed to create session";
            toast.error(message);
        }
    };

    // Handle command execution
    const handleCommand = useCallback(
        async (command: Command) => {
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
                            title: replaceSessionOnNew
                                ? currentTitle
                                : undefined,
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
                            messageId: lastAssistantMessage.info.id
                        });
                        break;
                    }

                    case "redo": {
                        await unrevertSession.mutateAsync({
                            sessionId: activeSessionId
                        });
                        break;
                    }

                    case "review": {
                        await sessionCommand.mutateAsync({
                            sessionId: activeSessionId,
                            command: "review"
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
                            modelId: selectedModel.modelID
                        });
                        break;
                    }

                    case "copy": {
                        await copySession.mutateAsync({
                            sessionId: activeSessionId
                        });
                        break;
                    }

                    case "export": {
                        await exportSession.mutateAsync({
                            sessionId: activeSessionId,
                            sessionTitle: session?.title
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
                const message =
                    error instanceof Error
                        ? error.message
                        : `Failed to execute command: ${command.name}`;
                toast.error(message);
            }
        },
        [
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
            exportSession
        ]
    );

    // Handle session rename
    const handleRenameSession = useCallback(
        async (newTitle: string) => {
            if (!activeSessionId) return;
            try {
                await renameSession.mutateAsync({
                    id: activeSessionId,
                    title: newTitle
                });
                setRenameDialogOpen(false);
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Failed to rename session";
                toast.error(message);
            }
        },
        [activeSessionId, renameSession]
    );

    // Handle Allotment resize - track live sizes
    const handleAllotmentChange = useCallback((sizes: number[]) => {
        if (sizes.length >= 3) {
            setPaneSizes(sizes);
        }
    }, []);

    // Persist sizes to store when drag ends
    // Note: Allotment's onDragEnd doesn't pass sizes, so we use paneSizes from state
    const handleAllotmentDragEnd = useCallback(() => {
        if (paneSizes.length >= 3) {
            // Only persist if not collapsed (snapped)
            if (paneSizes[0] > SESSIONS_SIDEBAR_MIN + 10) {
                setSessionsSidebarWidth(paneSizes[0]);
            }
            if (paneSizes[2] > CHAT_SIDEBAR_MIN + 10) {
                setChatSidebarWidth(paneSizes[2]);
            }
        }
    }, [paneSizes, setSessionsSidebarWidth, setChatSidebarWidth]);

    // Handle collapse for sessions sidebar (in Allotment)
    // Toggle between minimum size and stored width
    const handleSessionsSidebarCollapse = useCallback(() => {
        if (!allotmentRef.current) return;

        // Get current sizes for all 3 panes
        const currentSessionsWidth = paneSizes[0] || sessionsSidebarWidth;
        const currentMainWidth = paneSizes[1] || 0;
        const currentChatWidth = paneSizes[2] || chatSidebarWidth;

        if (!isSessionsSidebarCollapsed) {
            // Collapse: reduce sessions sidebar, give extra space to main content
            const widthDiff = currentSessionsWidth - SESSIONS_SIDEBAR_MIN;
            allotmentRef.current.resize([
                SESSIONS_SIDEBAR_MIN,
                currentMainWidth + widthDiff,
                currentChatWidth
            ]);
        } else {
            // Expand: increase sessions sidebar, take space from main content
            const expandedWidth =
                sessionsSidebarWidth > SESSIONS_SIDEBAR_MIN + 10
                    ? sessionsSidebarWidth
                    : 320;
            const widthDiff = expandedWidth - SESSIONS_SIDEBAR_MIN;
            allotmentRef.current.resize([
                expandedWidth,
                currentMainWidth - widthDiff,
                currentChatWidth
            ]);
        }
    }, [
        isSessionsSidebarCollapsed,
        sessionsSidebarWidth,
        chatSidebarWidth,
        paneSizes
    ]);

    // Handle collapse for chat sidebar (in Allotment)
    const handleChatSidebarCollapse = useCallback(() => {
        if (!allotmentRef.current) return;

        // Get current sizes for all 3 panes
        const currentSessionsWidth = paneSizes[0] || sessionsSidebarWidth;
        const currentMainWidth = paneSizes[1] || 0;
        const currentChatWidth = paneSizes[2] || chatSidebarWidth;

        if (!isChatSidebarCollapsed) {
            // Collapse: reduce chat sidebar, give extra space to main content
            const widthDiff = currentChatWidth - CHAT_SIDEBAR_MIN;
            allotmentRef.current.resize([
                currentSessionsWidth,
                currentMainWidth + widthDiff,
                CHAT_SIDEBAR_MIN
            ]);
        } else {
            // Expand: increase chat sidebar, take space from main content
            const expandedWidth =
                chatSidebarWidth > CHAT_SIDEBAR_MIN + 10
                    ? chatSidebarWidth
                    : 288;
            const widthDiff = expandedWidth - CHAT_SIDEBAR_MIN;
            allotmentRef.current.resize([
                currentSessionsWidth,
                currentMainWidth - widthDiff,
                expandedWidth
            ]);
        }
    }, [
        isChatSidebarCollapsed,
        chatSidebarWidth,
        sessionsSidebarWidth,
        paneSizes
    ]);

    const sessionTitle =
        session?.title ||
        (activeSessionId
            ? `Session ${activeSessionId.slice(0, 8)}`
            : undefined);
    const hasNoSessions = !isLoadingSessions && sortedSessions.length === 0;

    // Main content component (reused in both layouts)
    const mainContent = hasNoSessions ? (
        <EmptyState
            onCreateSession={handleCreateSession}
            isLoading={createSession.isPending}
        />
    ) : (
        <ErrorBoundary inline className="h-full">
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
                hideSidebar={isDesktop}
            />
        </ErrorBoundary>
    );

    return (
        <div className="flex h-dvh flex-col">
            <Header
                sessionTitle={sessionTitle}
                onOpenMobileSessionsSheet={() =>
                    setMobileSessionsSheetOpen(true)
                }
                onOpenMobileChatSheet={() => setMobileChatSheetOpen(true)}
            />

            {isDesktop ? (
                /* Desktop layout with resizable Allotment panes */
                <Allotment
                    ref={allotmentRef}
                    className="flex-1"
                    onChange={handleAllotmentChange}
                    onDragEnd={handleAllotmentDragEnd}
                >
                    {/* Sessions sidebar pane */}
                    <Allotment.Pane
                        minSize={SESSIONS_SIDEBAR_MIN}
                        maxSize={SESSIONS_SIDEBAR_MAX}
                        preferredSize={sessionsSidebarWidth}
                    >
                        <SessionsSidebar
                            inAllotment
                            isCollapsed={isSessionsSidebarCollapsed}
                            onCollapse={handleSessionsSidebarCollapse}
                        />
                    </Allotment.Pane>

                    {/* Main chat content pane */}
                    <Allotment.Pane>{mainContent}</Allotment.Pane>

                    {/* Chat sidebar pane */}
                    <Allotment.Pane
                        minSize={CHAT_SIDEBAR_MIN}
                        maxSize={CHAT_SIDEBAR_MAX}
                        preferredSize={chatSidebarWidth}
                    >
                        <ChatSidebar
                            messages={sidebarMessages}
                            contextLimit={contextLimit}
                            onCommand={handleCommand}
                            hasSession={!!activeSessionId && !hasNoSessions}
                            isBusy={isBusy || sendMessage.isPending}
                            inAllotment
                            isCollapsed={isChatSidebarCollapsed}
                            onCollapse={handleChatSidebarCollapse}
                            className="h-full border-l-0"
                        />
                    </Allotment.Pane>
                </Allotment>
            ) : (
                /* Mobile layout - simple flex container */
                <div className="flex-1 overflow-hidden">{mainContent}</div>
            )}

            {/* Mobile sessions sheet */}
            <Sheet
                open={mobileSessionsSheetOpen}
                onOpenChange={setMobileSessionsSheetOpen}
            >
                <SheetContent
                    side="left"
                    className="w-64 max-w-[85vw] p-0"
                    showCloseButton={false}
                >
                    <SheetTitle className="sr-only">Sessions</SheetTitle>
                    <SessionsSidebar
                        forceExpanded
                        onSessionSelect={() =>
                            setMobileSessionsSheetOpen(false)
                        }
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
                Create your first session to start chatting with OpenCode. Each
                session is tied to a project directory.
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
