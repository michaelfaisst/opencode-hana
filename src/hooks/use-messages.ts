import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOpencodeClient } from "@/providers";
import { QUERY_KEYS } from "@/lib/constants";
import { getWebSessionInfo } from "./use-sessions";
import type { AgentMode } from "@/stores";

/**
 * Extract a user-friendly error message from an API error response.
 * Handles the OpenCode server error format: { error: { message, code, param, type } }
 */
function extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!error || typeof error !== "object") {
        return fallbackMessage;
    }

    // Handle { error: { message: string } } format
    if ("error" in error) {
        const errorObj = (error as { error: unknown }).error;
        if (errorObj && typeof errorObj === "object" && "message" in errorObj) {
            return (errorObj as { message: string }).message;
        }
    }

    // Handle { message: string } format
    if (
        "message" in error &&
        typeof (error as { message: unknown }).message === "string"
    ) {
        return (error as { message: string }).message;
    }

    return fallbackMessage;
}

export function useMessages(sessionId: string) {
    const client = useOpencodeClient();

    return useQuery({
        queryKey: QUERY_KEYS.messages(sessionId),
        queryFn: async () => {
            const sessionInfo = getWebSessionInfo(sessionId);
            const response = await client.session.messages({
                path: { id: sessionId },
                query: { directory: sessionInfo?.directory }
            });
            if (response.error) {
                throw new Error(
                    extractErrorMessage(
                        response.error,
                        "Failed to fetch messages"
                    )
                );
            }
            return response.data ?? [];
        },
        enabled: !!sessionId,
        // Messages need to update frequently during streaming
        staleTime: 0,
        // Ensure refetch happens when invalidated, even if already fetching
        refetchOnMount: true
    });
}

export interface ImageAttachment {
    id: string;
    file: File;
    dataUrl: string;
    mime: string;
}

interface SendMessageParams {
    sessionId: string;
    text: string;
    images?: ImageAttachment[];
    model?: {
        providerID: string;
        modelID: string;
    };
    mode?: AgentMode;
    systemPrompt?: string;
}

export function useSendMessage() {
    const client = useOpencodeClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({
            sessionId,
            text,
            images,
            model,
            mode,
            systemPrompt
        }: SendMessageParams) => {
            if (!model) {
                throw new Error("No model selected");
            }

            // Get the session directory
            const sessionInfo = getWebSessionInfo(sessionId);

            // Build parts array with text and images
            const parts: Array<
                | { type: "text"; text: string }
                | { type: "file"; mime: string; url: string; filename?: string }
            > = [];

            // Add text part if there's text
            if (text.trim()) {
                parts.push({ type: "text", text });
            }

            // Add image parts
            if (images && images.length > 0) {
                for (const image of images) {
                    parts.push({
                        type: "file",
                        mime: image.mime,
                        url: image.dataUrl,
                        filename: image.file.name
                    });
                }
            }

            // Ensure we have at least one part
            if (parts.length === 0) {
                throw new Error("Message must have text or images");
            }

            const response = await client.session.prompt({
                path: { id: sessionId },
                query: { directory: sessionInfo?.directory },
                body: {
                    model,
                    parts,
                    ...(mode && { agent: mode }),
                    ...(systemPrompt && { system: systemPrompt })
                }
            });
            if (response.error) {
                throw new Error(
                    extractErrorMessage(
                        response.error,
                        "Failed to send message"
                    )
                );
            }
            return response.data;
        },
        onMutate: async ({ sessionId, text, images }) => {
            // Cancel any outgoing refetches so they don't overwrite our optimistic update
            await queryClient.cancelQueries({
                queryKey: QUERY_KEYS.messages(sessionId)
            });

            // Snapshot the previous value
            const previousMessages = queryClient.getQueryData(
                QUERY_KEYS.messages(sessionId)
            );

            // Build optimistic message parts
            const optimisticParts: Array<{
                type: string;
                text?: string;
                mime?: string;
                url?: string;
            }> = [];

            if (text.trim()) {
                optimisticParts.push({ type: "text", text });
            }

            if (images && images.length > 0) {
                for (const image of images) {
                    optimisticParts.push({
                        type: "file",
                        mime: image.mime,
                        url: image.dataUrl
                    });
                }
            }

            // Create optimistic user message
            const optimisticMessage = {
                info: {
                    id: `optimistic-${Date.now()}`,
                    role: "user" as const
                },
                parts: optimisticParts
            };

            // Optimistically update to the new value
            queryClient.setQueryData(
                QUERY_KEYS.messages(sessionId),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (old: any[] | undefined) => [...(old || []), optimisticMessage]
            );

            // Return context with the previous value
            return { previousMessages };
        },
        onError: (_, variables, context) => {
            // If the mutation fails, use the context returned from onMutate to roll back
            if (context?.previousMessages) {
                queryClient.setQueryData(
                    QUERY_KEYS.messages(variables.sessionId),
                    context.previousMessages
                );
            }
        },
        onSettled: (_, __, variables) => {
            // Always refetch after error or success to ensure cache is in sync with server
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.messages(variables.sessionId)
            });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
        }
    });
}

export function useAbortSession() {
    const client = useOpencodeClient();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (sessionId: string) => {
            const sessionInfo = getWebSessionInfo(sessionId);
            const response = await client.session.abort({
                path: { id: sessionId },
                query: { directory: sessionInfo?.directory }
            });
            if (response.error) {
                throw new Error(
                    extractErrorMessage(
                        response.error,
                        "Failed to abort session"
                    )
                );
            }
            return response.data;
        },
        onSuccess: (_, sessionId) => {
            queryClient.invalidateQueries({
                queryKey: QUERY_KEYS.messages(sessionId)
            });
        }
    });
}
