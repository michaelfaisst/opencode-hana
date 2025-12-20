import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
    X,
    Image as ImageIcon,
    Loader2,
    RefreshCw,
    AlertCircle
} from "lucide-react";
import { MessageList } from "./message-list";
import { MessageInput } from "./message-input";
import { ChatSidebar } from "./chat-sidebar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useProviders, type ImageAttachment, type Command } from "@/hooks";
import {
    useAppSettingsStore,
    useUILayoutStore,
    useSessionStore
} from "@/stores";
import { sendCompletionNotification } from "@/lib/notifications";

interface Part {
    type: string;
    text?: string;
    tool?: string;
    state?: {
        input?: {
            todos?: Array<{
                id: string;
                content: string;
                status: "pending" | "in_progress" | "completed" | "cancelled";
                priority: "high" | "medium" | "low";
            }>;
        };
    };
    toolInvocation?: {
        toolName: string;
        args: Record<string, unknown>;
    };
    [key: string]: unknown;
}

interface MessageInfo {
    id: string;
    role: "user" | "assistant";
    tokens?: {
        input: number;
        output: number;
        reasoning: number;
        cache: {
            read: number;
            write: number;
        };
    };
    cost?: number;
}

interface Message {
    info: MessageInfo;
    parts: Part[];
}

interface RetryStatus {
    type: "retry";
    attempt: number;
    message: string;
    next: number;
}

interface QueuedMessage {
    id: string;
    text: string;
    images?: ImageAttachment[];
}

interface ChatContainerProps {
    messages: Message[];
    isLoadingMessages?: boolean;
    isSending?: boolean;
    isBusy?: boolean;
    isRetrying?: boolean;
    retryStatus?: RetryStatus;
    onSendMessage: (message: string, images?: ImageAttachment[]) => void;
    onAbort?: () => void;
    onCommand?: (command: Command) => void;
    /** Auto-focus the input field */
    autoFocusInput?: boolean;
    /** Session ID for resetting scroll state on session change */
    sessionId?: string;
}

export function ChatContainer({
    messages,
    isLoadingMessages,
    isSending,
    isBusy,
    isRetrying,
    retryStatus,
    onSendMessage,
    onAbort,
    onCommand,
    autoFocusInput,
    sessionId
}: ChatContainerProps) {
    const { data: providersData } = useProviders();
    const { selectedModel, agentMode, toggleAgentMode } = useAppSettingsStore();
    const { mobileChatSheetOpen, setMobileChatSheetOpen } = useUILayoutStore();
    const { error: sessionError, clearError } = useSessionStore();

    // Message queue for when agent is busy
    const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
    const processingRef = useRef(false);
    const wasBusyRef = useRef(false);

    // Get context limit for the selected model
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
            tokens: m.info.tokens,
            cost: m.info.cost
        }));
    }, [messages]);

    // Process message queue when agent becomes idle
    useEffect(() => {
        if (
            !isBusy &&
            !isSending &&
            messageQueue.length > 0 &&
            !processingRef.current
        ) {
            processingRef.current = true;
            const nextMessage = messageQueue[0];

            // Small delay to let the UI update, then update state and send
            setTimeout(() => {
                setMessageQueue((prev) => prev.slice(1));
                onSendMessage(nextMessage.text, nextMessage.images);
                processingRef.current = false;
            }, 100);
        }
    }, [isBusy, isSending, messageQueue, onSendMessage]);

    // Send notification when assistant finishes responding
    useEffect(() => {
        const isCurrentlyBusy = isBusy || isRetrying;

        // Detect transition from busy to not busy
        if (wasBusyRef.current && !isCurrentlyBusy) {
            sendCompletionNotification();
        }

        wasBusyRef.current = isCurrentlyBusy ?? false;
    }, [isBusy, isRetrying]);

    // Handle sending message (queue if busy)
    const handleSendMessage = useCallback(
        (text: string, images?: ImageAttachment[]) => {
            // Clear any existing error when sending a new message
            clearError();

            if (isBusy || isSending) {
                // Add to queue
                setMessageQueue((prev) => [
                    ...prev,
                    {
                        id: crypto.randomUUID(),
                        text,
                        images
                    }
                ]);
            } else {
                onSendMessage(text, images);
            }
        },
        [isBusy, isSending, onSendMessage, clearError]
    );

    // Remove a queued message
    const removeFromQueue = useCallback((id: string) => {
        setMessageQueue((prev) => prev.filter((m) => m.id !== id));
    }, []);

    return (
        <div className="flex h-full">
            {/* Main chat area */}
            <div className="flex-1 flex flex-col min-w-0">
                <MessageList
                    key={sessionId}
                    messages={messages}
                    isLoading={isLoadingMessages}
                    isBusy={isBusy}
                    isRetrying={isRetrying}
                />

                {/* Error message display */}
                {sessionError && (
                    <div className="flex items-start gap-3 px-4 py-3 bg-destructive/10 border-t border-destructive/20">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                            <AlertCircle className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-destructive mb-1">
                                Error
                            </div>
                            <div className="text-sm text-destructive/90 whitespace-pre-wrap">
                                {sessionError.message}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0 text-destructive hover:text-destructive hover:bg-destructive/20"
                            onClick={clearError}
                        >
                            <X className="h-3 w-3" />
                            <span className="sr-only">Dismiss error</span>
                        </Button>
                    </div>
                )}

                {/* Streaming indicator - shown instantly when busy */}
                {(isBusy || isRetrying) && (
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground border-t border-border bg-muted/30">
                        {isRetrying && retryStatus ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                <span>
                                    Retry attempt {retryStatus.attempt}:{" "}
                                    {retryStatus.message}
                                </span>
                            </>
                        ) : (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Assistant is thinking...</span>
                            </>
                        )}
                    </div>
                )}

                {/* Queued messages */}
                {messageQueue.length > 0 && (
                    <div className="border-t border-border bg-muted/30">
                        <div className="px-4 py-2">
                            <div className="text-xs font-medium text-muted-foreground mb-2">
                                Queued messages ({messageQueue.length})
                            </div>
                            <div className="space-y-2">
                                {messageQueue.map((queuedMsg, index) => (
                                    <div
                                        key={queuedMsg.id}
                                        className="flex items-start gap-2 bg-background rounded border border-border p-2"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs text-muted-foreground mb-1">
                                                #{index + 1}
                                            </div>
                                            <div className="text-sm truncate">
                                                {queuedMsg.text || "(no text)"}
                                            </div>
                                            {queuedMsg.images &&
                                                queuedMsg.images.length > 0 && (
                                                    <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                                                        <ImageIcon className="h-3 w-3" />
                                                        {
                                                            queuedMsg.images
                                                                .length
                                                        }{" "}
                                                        image
                                                        {queuedMsg.images
                                                            .length > 1
                                                            ? "s"
                                                            : ""}
                                                    </div>
                                                )}
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 shrink-0"
                                            onClick={() =>
                                                removeFromQueue(queuedMsg.id)
                                            }
                                        >
                                            <X className="h-3 w-3" />
                                            <span className="sr-only">
                                                Remove from queue
                                            </span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-border bg-background">
                    <MessageInput
                        onSendMessage={handleSendMessage}
                        onAbort={onAbort}
                        onToggleMode={toggleAgentMode}
                        onCommand={onCommand}
                        isBusy={isBusy}
                        agentMode={agentMode}
                        autoFocus={autoFocusInput}
                    />
                </div>
            </div>

            {/* Desktop sidebar - hidden on small screens */}
            <div className="hidden lg:block shrink-0">
                <ChatSidebar
                    messages={sidebarMessages}
                    contextLimit={contextLimit}
                    onCommand={onCommand}
                    hasSession={true}
                    isBusy={isBusy || isSending}
                />
            </div>

            {/* Mobile chat sidebar sheet */}
            <Sheet
                open={mobileChatSheetOpen}
                onOpenChange={setMobileChatSheetOpen}
            >
                <SheetContent
                    side="right"
                    className="w-80 p-0"
                    showCloseButton={false}
                >
                    <SheetTitle className="sr-only">Session Info</SheetTitle>
                    <ChatSidebar
                        messages={sidebarMessages}
                        contextLimit={contextLimit}
                        onCommand={onCommand}
                        hasSession={true}
                        isBusy={isBusy || isSending}
                        className="border-l-0 w-full"
                        forceExpanded
                    />
                </SheetContent>
            </Sheet>
        </div>
    );
}
