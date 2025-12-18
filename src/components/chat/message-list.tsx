import { useRef, useCallback, useState, useEffect } from "react";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import { ArrowDown } from "lucide-react";
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

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  isBusy?: boolean;
  isRetrying?: boolean;
}

export function MessageList({ 
  messages, 
  isLoading, 
  isBusy,
  isRetrying,
}: MessageListProps) {
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const prevMessageCountRef = useRef(0);
  const wasBusyRef = useRef(false);

  // Keep atBottomRef in sync with state
  useEffect(() => {
    atBottomRef.current = atBottom;
  }, [atBottom]);

  // Helper to scroll the container to the very bottom
  const scrollToVeryBottom = useCallback(() => {
    const scroller = containerRef.current?.querySelector('[data-virtuoso-scroller="true"]') as HTMLElement | null;
    if (scroller) {
      scroller.scrollTop = scroller.scrollHeight;
    }
  }, []);

  // Scroll to bottom when:
  // 1. We just became busy (user sent a message)
  // 2. A new message was added while we were at bottom
  // 3. Just finished streaming (busy -> not busy) - final scroll to catch last content
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
    
    // Case 2: Just finished streaming - do a final scroll after content settles
    if (!isNowBusy && wasBusy && atBottomRef.current) {
      // Use multiple delayed scrolls to ensure we catch the final rendered height
      // Use direct DOM scroll to guarantee we reach the absolute bottom
      scrollToVeryBottom();
      setTimeout(scrollToVeryBottom, 100);
      setTimeout(scrollToVeryBottom, 300);
      return;
    }
    
    // Case 3: New message added - scroll if we were at bottom
    if (messageCount > prevMessageCount && atBottomRef.current) {
      virtuosoRef.current?.scrollToIndex({
        index: messages.length - 1,
        align: "end",
        behavior: "auto",
      });
      return;
    }
  }, [messages.length, isBusy, isRetrying]);

  // Scroll during streaming when content updates and we're at bottom
  // This handles the case where message content grows but count stays the same
  // Use "auto" (instant) during streaming since smooth can't keep up with rapid updates
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
      behavior: "auto",
    });
  }, [messages.length]);

  // followOutput callback - follow when at bottom during streaming
  // Use "auto" for instant scroll during streaming to keep up with content
  const followOutput = useCallback(
    (isAtBottom: boolean) => {
      // Auto-scroll when user is at bottom
      return isAtBottom ? "auto" : false;
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
    <div ref={containerRef} className="relative flex-1 overflow-hidden">
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
