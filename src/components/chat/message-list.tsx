import { useRef, useCallback, useState, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import { ArrowDown, Loader2, RefreshCw } from "lucide-react";
import { MessageItem } from "./message-item";
import { Skeleton } from "@/components/common/loading-skeleton";
import { Button } from "@/components/ui/button";


interface Part {
  type: string;
  text?: string;
  toolInvocation?: {
    toolName: string;
    args: Record<string, unknown>;
  };
  [key: string]: unknown;
}

interface Message {
  info: {
    id: string;
    role: "user" | "assistant";
  };
  parts: Part[];
}

interface RetryStatus {
  type: "retry";
  attempt: number;
  message: string;
  next: number;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isBusy?: boolean;
  isRetrying?: boolean;
  retryStatus?: RetryStatus;
}

// Streaming indicator component - rendered in Footer, outside virtualized list
function StreamingIndicator({ retryStatus }: { retryStatus?: RetryStatus }) {
  if (retryStatus) {
    const nextRetryTime = new Date(retryStatus.next).toLocaleTimeString();
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>
          Retrying (attempt {retryStatus.attempt}): {retryStatus.message}
        </span>
        <span className="text-xs text-muted-foreground">
          Next attempt at {nextRetryTime}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>Assistant is thinking</span>
      <div className="flex gap-0.5">
        <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
        <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
      </div>
    </div>
  );
}

export function MessageList({ 
  messages, 
  isLoading, 
  isBusy,
  isRetrying,
  retryStatus,
}: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const wasBusyRef = useRef(false);

  // Keep atBottomRef in sync with state
  useEffect(() => {
    atBottomRef.current = atBottom;
  }, [atBottom]);

  const showStreamingIndicator = isBusy || isRetrying;

  // Scroll to bottom when:
  // 1. We just became busy (user sent a message)
  // 2. A new message was added while we were at bottom
  useEffect(() => {
    const messageCount = messages.length;
    const prevMessageCount = prevMessageCountRef.current;
    const wasBusy = wasBusyRef.current;
    const isNowBusy = isBusy || isRetrying;
    
    // Update refs for next render
    prevMessageCountRef.current = messageCount;
    wasBusyRef.current = isNowBusy ?? false;
    
    // Case 1: Just became busy (user sent a message) - always scroll
    if (isNowBusy && !wasBusy) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: "end",
        behavior: "auto",
      });
      return;
    }
    
    // Case 2: New message added - scroll if we were at bottom
    if (messageCount > prevMessageCount && atBottomRef.current) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: "end",
        behavior: "smooth",
      });
      return;
    }
  }, [messages.length, isBusy, isRetrying]);

  // Scroll during streaming when content updates and we're at bottom
  // This handles the case where message content grows but count stays the same
  useEffect(() => {
    if ((isBusy || isRetrying) && atBottomRef.current) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: "end",
        behavior: "auto",
      });
    }
  }, [messages, isBusy, isRetrying]);

  // Handle scroll to bottom button click
  const scrollToBottom = useCallback(() => {
    virtuosoRef.current?.scrollToIndex({
      index: messages.length - 1,
      align: "end",
      behavior: "smooth",
    });
  }, [messages.length]);

  // followOutput callback - follow when at bottom during streaming
  const followOutput = useCallback(
    (isAtBottom: boolean) => {
      // Auto-scroll when user is at bottom
      return isAtBottom ? "smooth" : false;
    },
    []
  );

  // Compute item key
  const computeItemKey = useCallback((_index: number, item: Message) => {
    return item.info.id;
  }, []);

  // Render item content
  const itemContent = useCallback((_index: number, item: Message) => {
    return <MessageItem role={item.info.role} parts={item.parts} />;
  }, []);

  // Footer component for streaming indicator
  const Footer = useCallback(() => {
    if (!showStreamingIndicator) return null;
    return <StreamingIndicator retryStatus={retryStatus} />;
  }, [showStreamingIndicator, retryStatus]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-medium">Start a conversation</p>
        <p className="text-sm text-muted-foreground">
          Send a message to begin chatting with OpenCode
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex-1 overflow-hidden">
      <Virtuoso
        ref={virtuosoRef}
        data={messages}
        atBottomStateChange={setAtBottom}
        atBottomThreshold={200}
        computeItemKey={computeItemKey}
        itemContent={itemContent}
        followOutput={followOutput}
        initialTopMostItemIndex={messages.length - 1}
        alignToBottom
        components={{ Footer }}
        className="absolute inset-0 custom-scrollbar"
      />

      {/* Scroll to bottom button */}
      {!atBottom && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md z-10"
          onClick={scrollToBottom}
        >
          <ArrowDown className="h-4 w-4" />
          <span className="sr-only">Scroll to bottom</span>
        </Button>
      )}
    </div>
  );
}
