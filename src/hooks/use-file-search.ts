import { useState, useCallback, useRef, useEffect } from "react";
import { opencodeClient } from "@/lib/opencode";

interface UseFileSearchOptions {
    debounceMs?: number;
    /** The directory to search in. If not provided, uses the server's default. */
    directory?: string;
}

export function useFileSearch(options: UseFileSearchOptions = {}) {
    const { debounceMs = 150, directory } = options;

    const [files, setFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const abortControllerRef = useRef<AbortController | null>(null);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastQueryRef = useRef<string>("");

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    const searchFiles = useCallback(
        (query: string) => {
            // Clear any pending debounce
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }

            // If query is the same, don't search again
            if (query === lastQueryRef.current && files.length > 0) {
                return;
            }

            // Only show loading if we don't have results yet
            if (files.length === 0) {
                setIsLoading(true);
            }

            debounceTimerRef.current = setTimeout(async () => {
                // Abort any in-flight request
                if (abortControllerRef.current) {
                    abortControllerRef.current.abort();
                }
                abortControllerRef.current = new AbortController();

                lastQueryRef.current = query;
                setError(null);

                try {
                    const response = await opencodeClient.find.files({
                        query: { query: query || "", directory }
                    });

                    if (response.data) {
                        setFiles(response.data.slice(0, 20));
                    } else {
                        setFiles([]);
                    }
                } catch (err) {
                    // Ignore abort errors
                    if (err instanceof Error && err.name === "AbortError") {
                        return;
                    }
                    setError(
                        err instanceof Error
                            ? err
                            : new Error("Failed to search files")
                    );
                    setFiles([]);
                } finally {
                    setIsLoading(false);
                }
            }, debounceMs);
        },
        [debounceMs, directory, files.length]
    );

    const clearFiles = useCallback(() => {
        // Clear any pending operations
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        setFiles([]);
        setError(null);
        setIsLoading(false);
        lastQueryRef.current = "";
    }, []);

    return {
        files,
        isLoading,
        error,
        searchFiles,
        clearFiles
    };
}
