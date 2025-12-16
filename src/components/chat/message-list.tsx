import { useEffect, useRef, useCallback, useState, useMemo } from "react";
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
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  // Keep a ref for the auto-scroll logic (doesn't need to trigger re-renders)
  const isNearBottomRef = useRef(true);

  // Create a fingerprint of the messages to detect content changes
  // This captures both new messages and updated content (streaming)
  const messagesFingerprint = useMemo(() => {
    return messages.map(m => {
      // Get the total text length of all parts to detect streaming updates
      const partsLength = m.parts.reduce((acc, p) => {
        return acc + (p.text?.length ?? 0) + (p.type === "tool-invocation" ? 1 : 0);
      }, 0);
      return `${m.info.id}:${m.parts.length}:${partsLength}`;
    }).join("|");
  }, [messages]);

  // Check if user is near bottom of scroll
  const checkIfNearBottom = useCallback(() => {
    const container = containerRef.current;
    if (!container) return true;
    
    const threshold = 150; // pixels from bottom
    const isNear = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    isNearBottomRef.current = isNear;
    setShowScrollButton(!isNear);
    return isNear;
  }, []);

  // Auto-scroll when messages change (new messages or content updates) and user is near bottom
  useEffect(() => {
    // Only auto-scroll if user was near bottom
    if (isNearBottomRef.current) {
      // Use requestAnimationFrame to ensure DOM has updated
      requestAnimationFrame(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messagesFingerprint]);

  // Track scroll position
  const handleScroll = useCallback(() => {
    checkIfNearBottom();
  }, [checkIfNearBottom]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
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
    <div className="relative flex-1 overflow-hidden">
      <div 
        ref={containerRef}
        className="absolute inset-0 overflow-y-auto"
        onScroll={handleScroll}
      >
        {messages.map((message) => (
          <MessageItem
            key={message.info.id}
            role={message.info.role}
            parts={message.parts}
          />
        ))}
        <div ref={bottomRef} />
      </div>
      
      {/* Scroll to bottom button */}
      {showScrollButton && (
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
