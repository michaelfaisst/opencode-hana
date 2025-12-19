import { useState, useCallback, useRef, useEffect } from "react";

const STORAGE_KEY = "opencode-input-history";
const MAX_HISTORY_SIZE = 100;

interface UseInputHistoryOptions {
    maxSize?: number;
}

interface UseInputHistoryReturn {
    /** Add a message to the history */
    addToHistory: (message: string) => void;
    /** Navigate to the previous message (older), saves current input as draft */
    navigateUp: (currentInput: string) => string | undefined;
    /** Navigate to the next message (newer), returns draft when back at start */
    navigateDown: () => string | undefined;
    /** Reset navigation position (call when user types) */
    resetNavigation: () => void;
    /** Whether currently navigating through history */
    isNavigating: boolean;
    /** Total history length */
    historyLength: number;
}

/**
 * Hook to manage input history with persistence to localStorage.
 * Allows navigating through previous inputs using arrow keys,
 * similar to terminal/shell history.
 */
export function useInputHistory(
    options: UseInputHistoryOptions = {}
): UseInputHistoryReturn {
    const { maxSize = MAX_HISTORY_SIZE } = options;

    // History stored with newest first (index 0 is most recent)
    const [history, setHistory] = useState<string[]>(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    return parsed.slice(0, maxSize);
                }
            }
        } catch {
            // Ignore parsing errors
        }
        return [];
    });

    // Navigation index: -1 means not navigating (fresh input), 0 is most recent, etc.
    // Using ref to avoid stale closure issues in callbacks
    const navigationIndexRef = useRef(-1);
    const [isNavigating, setIsNavigating] = useState(false);

    // Keep a ref for the current draft message (what user was typing before navigating)
    const draftRef = useRef<string>("");

    // Persist history to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch {
            // Ignore storage errors (quota exceeded, etc.)
        }
    }, [history]);

    const addToHistory = useCallback(
        (message: string) => {
            const trimmed = message.trim();
            if (!trimmed) return;

            setHistory((prev) => {
                // Remove duplicates of this message
                const filtered = prev.filter((item) => item !== trimmed);
                // Add to the front (newest first)
                const updated = [trimmed, ...filtered];
                // Limit size
                return updated.slice(0, maxSize);
            });

            // Reset navigation after adding
            navigationIndexRef.current = -1;
            draftRef.current = "";
            setIsNavigating(false);
        },
        [maxSize]
    );

    const navigateUp = useCallback(
        (currentInput: string): string | undefined => {
            if (history.length === 0) return undefined;

            const currentIndex = navigationIndexRef.current;

            // Save draft only when starting navigation
            if (currentIndex === -1) {
                draftRef.current = currentInput;
            }

            const newIndex = currentIndex + 1;
            if (newIndex >= history.length) {
                // Already at the oldest entry
                return undefined;
            }

            navigationIndexRef.current = newIndex;
            setIsNavigating(true);
            return history[newIndex];
        },
        [history]
    );

    const navigateDown = useCallback((): string | undefined => {
        const currentIndex = navigationIndexRef.current;

        if (currentIndex < 0) {
            // Not navigating, nothing to do
            return undefined;
        }

        const newIndex = currentIndex - 1;
        navigationIndexRef.current = newIndex;
        setIsNavigating(newIndex >= 0);

        if (newIndex < 0) {
            // Return to draft
            return draftRef.current;
        }

        return history[newIndex];
    }, [history]);

    const resetNavigation = useCallback(() => {
        navigationIndexRef.current = -1;
        draftRef.current = "";
        setIsNavigating(false);
    }, []);

    return {
        addToHistory,
        navigateUp,
        navigateDown,
        resetNavigation,
        isNavigating,
        historyLength: history.length
    };
}
