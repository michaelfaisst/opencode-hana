import {
    useRef,
    useCallback,
    useState,
    useEffect,
    useMemo,
    useLayoutEffect
} from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { MessageItem } from "./message-item";
import { Skeleton } from "@/components/common/loading-skeleton";
import { Button } from "@/components/ui/button";

const MESSAGES_PER_BATCH = 30;
const SCROLL_THRESHOLD = 100;

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
        time?: {
            created?: number;
        };
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
    isRetrying
}: MessageListProps) {
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const sentinelRef = useRef<HTMLDivElement>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const shouldAutoScrollRef = useRef(true);
    const wasBusyRef = useRef(false);
    const hasInitialScrolled = useRef(false);
    const lastScrollTopRef = useRef(0);
    const isUserScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Pagination state
    const [visibleCount, setVisibleCount] = useState(MESSAGES_PER_BATCH);
    const [isLoadingMore, setIsLoadingMore] = useState(false);

    // Calculate which messages to show (from the end)
    const visibleMessages = useMemo(() => {
        const startIndex = Math.max(0, messages.length - visibleCount);
        return messages.slice(startIndex);
    }, [messages, visibleCount]);

    const hasMoreMessages = visibleCount < messages.length;

    // Check if currently at bottom (helper, no state updates)
    const isAtBottom = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return true;
        return (
            container.scrollHeight -
                container.scrollTop -
                container.clientHeight <
            SCROLL_THRESHOLD
        );
    }, []);

    // Scroll to bottom function (always instant during streaming to avoid fighting)
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
            requestAnimationFrame(() => {
                scrollToBottom(true);
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
        setVisibleCount((prev) =>
            Math.min(prev + MESSAGES_PER_BATCH, messages.length)
        );

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
                rootMargin: "200px",
                threshold: 0
            }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [hasMoreMessages, isLoadingMore, loadMoreMessages]);

    // Handle scroll - detect user scrolling up to disable auto-scroll
    const handleScroll = useCallback(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const currentScrollTop = container.scrollTop;
        const atBottom = isAtBottom();

        // Detect if user scrolled up (manual scroll away from bottom)
        if (currentScrollTop < lastScrollTopRef.current && !atBottom) {
            // User scrolled up - disable auto-scroll
            shouldAutoScrollRef.current = false;
            isUserScrollingRef.current = true;
        } else if (atBottom) {
            // User scrolled back to bottom - re-enable auto-scroll
            shouldAutoScrollRef.current = true;
        }

        lastScrollTopRef.current = currentScrollTop;

        // Debounce the button visibility update to prevent flickering
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        scrollTimeoutRef.current = setTimeout(() => {
            setShowScrollButton(!isAtBottom());
            isUserScrollingRef.current = false;
        }, 150);
    }, [isAtBottom]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Auto-scroll during streaming when shouldAutoScroll is true
    // Use useLayoutEffect to scroll before paint, reducing flicker
    useLayoutEffect(() => {
        if (
            shouldAutoScrollRef.current &&
            messages.length > 0 &&
            !isUserScrollingRef.current
        ) {
            scrollToBottom(false); // Always use smooth scrolling
        }
    }, [messages, scrollToBottom]);

    // Scroll to bottom when becoming busy (user sent message)
    useEffect(() => {
        const isNowBusy = isBusy || isRetrying;
        const wasBusy = wasBusyRef.current;

        // Just became busy - force scroll to bottom and enable auto-scroll
        if (isNowBusy && !wasBusy) {
            shouldAutoScrollRef.current = true;
            scrollToBottom(true);
        }

        wasBusyRef.current = isNowBusy ?? false;
    }, [isBusy, isRetrying, scrollToBottom]);

    // Re-enable auto-scroll when user clicks scroll to bottom button
    const handleScrollToBottomClick = useCallback(() => {
        shouldAutoScrollRef.current = true;
        scrollToBottom(false);
    }, [scrollToBottom]);

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
                        createdAt={message.info.time?.created}
                    />
                ))}
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-4 right-4 h-8 w-8 rounded-full shadow-md z-10"
                    onClick={handleScrollToBottomClick}
                >
                    <ArrowDown className="h-4 w-4" />
                    <span className="sr-only">Scroll to bottom</span>
                </Button>
            )}
        </div>
    );
}
