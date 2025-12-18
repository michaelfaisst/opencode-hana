import { useRef, useCallback, useState, useEffect, useMemo } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { MessageItem } from "./message-item";
import { Skeleton } from "@/components/common/loading-skeleton";
import { Button } from "@/components/ui/button";

const MESSAGES_PER_BATCH = 30;

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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [atBottom, setAtBottom] = useState(true);
  const atBottomRef = useRef(true);
  const wasBusyRef = useRef(false);
  const hasInitialScrolled = useRef(false);
  
  // Pagination state
  const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_BATCH);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Calculate which messages to show (from the end)
  const visibleMessages = useMemo(() => {
    const startIndex = Math.max(0, messages.length - visibleCount);
    return messages.slice(startIndex);
  }, [messages, visibleCount]);

  const hasMoreMessages = visibleCount < messages.length;

  // Scroll to bottom function (instant for initial, smooth for user actions)
  const scrollToBottom = useCallback((instant = false) => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTo({ 
        top: container.scrollHeight, 
        behavior: instant ? "instant" : "smooth" 
      });
    }
  }, []);

  // Initial scroll to bottom when messages first load
  useEffect(() => {
    if (messages.length > 0 && !hasInitialScrolled.current) {
      // Use requestAnimationFrame to ensure DOM has rendered
      requestAnimationFrame(() => {
        scrollToBottom(true); // Instant scroll for initial load
        hasInitialScrolled.current = true;
      });
    }
  }, [messages.length, scrollToBottom]);

  // Load more messages when sentinel becomes visible
  const loadMoreMessages = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || isLoadingMore) return;
    
    setIsLoadingMore(true);
    
    // Remember scroll position relative to content
    const scrollHeightBefore = container.scrollHeight;
    const scrollTopBefore = container.scrollTop;
    
    // Load more messages
    setVisibleCount(prev => Math.min(prev + MESSAGES_PER_BATCH, messages.length));
    
    // After DOM update, restore scroll position
    requestAnimationFrame(() => {
      const scrollHeightAfter = container.scrollHeight;
      const heightDiff = scrollHeightAfter - scrollHeightBefore;
      container.scrollTop = scrollTopBefore + heightDiff;
      setIsLoadingMore(false);
    });
  }, [messages.length, isLoadingMore]);

  // Intersection observer for loading more messages
  useEffect(() => {
    const sentinel = sentinelRef.current;
    const container = scrollContainerRef.current;
    if (!sentinel || !container || !hasMoreMessages) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          loadMoreMessages();
        }
      },
      { 
        root: container,
        rootMargin: "200px", // Trigger before sentinel is visible
        threshold: 0
      }
    );
    
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

  // Track if user is at bottom
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const threshold = 100;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
    atBottomRef.current = isAtBottom;
    setAtBottom(isAtBottom);
  }, []);

  // Auto-scroll when new messages arrive (if at bottom)
  useEffect(() => {
    if (atBottomRef.current && messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  // Scroll to bottom when becoming busy (user sent message)
  useEffect(() => {
    const isNowBusy = isBusy || isRetrying;
    const wasBusy = wasBusyRef.current;
    
    // Just became busy - scroll to bottom
    if (isNowBusy && !wasBusy) {
      scrollToBottom();
    }
    
    wasBusyRef.current = isNowBusy ?? false;
  }, [isBusy, isRetrying, scrollToBottom]);

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
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto custom-scrollbar"
      >
        {/* Sentinel for loading more messages */}
        {hasMoreMessages && (
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isLoadingMore ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : (
              <span className="text-xs text-muted-foreground">
                Scroll up for more messages
              </span>
            )}
          </div>
        )}
        
        {/* Messages */}
        {visibleMessages.map((message) => (
          <MessageItem 
            key={message.info.id}
            role={message.info.role} 
            parts={message.parts} 
          />
        ))}
      </div>

      {/* Scroll to bottom button */}
      {!atBottom && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md z-10"
          onClick={() => scrollToBottom()}
        >
          <ArrowDown className="h-4 w-4" />
          <span className="sr-only">Scroll to bottom</span>
        </Button>
      )}
    </div>
  );
}
