import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { useEvents } from "../use-events";

// Mock the notifications module
const mockSendCompletionNotification = vi.fn();
vi.mock("@/lib/notifications", () => ({
    sendCompletionNotification: (options?: unknown) =>
        mockSendCompletionNotification(options)
}));

// Mock sonner toast
vi.mock("sonner", () => ({
    toast: {
        info: vi.fn(),
        success: vi.fn(),
        warning: vi.fn(),
        error: vi.fn()
    }
}));

// Mock stores
vi.mock("@/stores", () => ({
    useSessionStore: {
        getState: () => ({
            setError: vi.fn()
        })
    },
    useMessageQueueStore: {
        getState: () => ({
            clearQueue: vi.fn()
        })
    }
}));

describe("useEvents", () => {
    let queryClient: QueryClient;
    let mockEventSourceInstance: {
        onopen: (() => void) | null;
        onmessage: ((event: { data: string }) => void) | null;
        onerror: ((error: unknown) => void) | null;
        close: ReturnType<typeof vi.fn>;
    };
    let originalEventSource: typeof EventSource;

    function createWrapper() {
        return ({ children }: { children: React.ReactNode }) =>
            createElement(
                QueryClientProvider,
                { client: queryClient },
                children
            );
    }

    beforeEach(() => {
        vi.clearAllMocks();
        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } }
        });

        // Save original EventSource
        originalEventSource = globalThis.EventSource;

        // Create a mock EventSource class
        class MockEventSource {
            onopen: (() => void) | null = null;
            onmessage: ((event: { data: string }) => void) | null = null;
            onerror: ((error: unknown) => void) | null = null;
            close = vi.fn();

            constructor() {
                // Store reference to this instance
                // eslint-disable-next-line @typescript-eslint/no-this-alias
                mockEventSourceInstance = this;
            }
        }

        // Mock EventSource constructor
        globalThis.EventSource =
            MockEventSource as unknown as typeof EventSource;
    });

    afterEach(() => {
        // Restore original EventSource
        globalThis.EventSource = originalEventSource;
    });

    function simulateEvent(event: object) {
        mockEventSourceInstance.onmessage?.({
            data: JSON.stringify({ directory: "/test", payload: event })
        });
    }

    describe("busy session tracking", () => {
        it("should track sessions with status type busy", () => {
            const { result } = renderHook(() => useEvents(), {
                wrapper: createWrapper()
            });

            // Simulate connection open
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Send busy status event
            act(() => {
                simulateEvent({
                    type: "session.status",
                    properties: {
                        sessionID: "session-123",
                        status: { type: "busy" }
                    }
                });
            });

            // Check session status is updated
            expect(result.current.sessionStatuses.get("session-123")).toEqual({
                type: "busy"
            });
        });

        it("should NOT track sessions with status type retry for notifications", () => {
            const mockNavigate = vi.fn();
            const mockGetTitle = vi.fn().mockReturnValue("Test Session");

            renderHook(
                () =>
                    useEvents({
                        navigateToSession: mockNavigate,
                        getSessionTitle: mockGetTitle
                    }),
                { wrapper: createWrapper() }
            );

            // Simulate connection open
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Send retry status event (NOT busy)
            act(() => {
                simulateEvent({
                    type: "session.status",
                    properties: {
                        sessionID: "session-456",
                        status: { type: "retry" }
                    }
                });
            });

            // Now send idle event
            act(() => {
                simulateEvent({
                    type: "session.idle",
                    properties: {
                        sessionID: "session-456"
                    }
                });
            });

            // Should NOT send notification because retry doesn't trigger busy tracking
            expect(mockSendCompletionNotification).not.toHaveBeenCalled();
        });

        it("should send notification on busy->idle transition", () => {
            const mockNavigate = vi.fn();
            const mockGetTitle = vi.fn().mockReturnValue("My Test Session");

            renderHook(
                () =>
                    useEvents({
                        navigateToSession: mockNavigate,
                        getSessionTitle: mockGetTitle
                    }),
                { wrapper: createWrapper() }
            );

            // Simulate connection open
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Send busy status
            act(() => {
                simulateEvent({
                    type: "session.status",
                    properties: {
                        sessionID: "session-789",
                        status: { type: "busy" }
                    }
                });
            });

            // Send idle status
            act(() => {
                simulateEvent({
                    type: "session.idle",
                    properties: {
                        sessionID: "session-789"
                    }
                });
            });

            // Should have called getSessionTitle
            expect(mockGetTitle).toHaveBeenCalledWith("session-789");

            // Should send notification with correct params
            expect(mockSendCompletionNotification).toHaveBeenCalledWith({
                title: "OpenCode",
                body: '"My Test Session" has finished responding',
                onClick: expect.any(Function)
            });
        });

        it("should call navigateToSession when notification onClick is triggered", () => {
            const mockNavigate = vi.fn();
            const mockGetTitle = vi.fn().mockReturnValue("Test Session");

            renderHook(
                () =>
                    useEvents({
                        navigateToSession: mockNavigate,
                        getSessionTitle: mockGetTitle
                    }),
                { wrapper: createWrapper() }
            );

            // Simulate connection open
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Send busy then idle
            act(() => {
                simulateEvent({
                    type: "session.status",
                    properties: {
                        sessionID: "session-nav",
                        status: { type: "busy" }
                    }
                });
            });

            act(() => {
                simulateEvent({
                    type: "session.idle",
                    properties: {
                        sessionID: "session-nav"
                    }
                });
            });

            // Get the onClick callback that was passed to sendCompletionNotification
            const callArgs = mockSendCompletionNotification.mock
                .calls[0][0] as {
                onClick: () => void;
            };
            callArgs.onClick();

            expect(mockNavigate).toHaveBeenCalledWith("session-nav");
        });

        it("should use truncated session ID when title is not available", () => {
            const mockNavigate = vi.fn();
            const mockGetTitle = vi.fn().mockReturnValue(undefined);

            renderHook(
                () =>
                    useEvents({
                        navigateToSession: mockNavigate,
                        getSessionTitle: mockGetTitle
                    }),
                { wrapper: createWrapper() }
            );

            // Simulate connection open
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Send busy then idle
            act(() => {
                simulateEvent({
                    type: "session.status",
                    properties: {
                        sessionID: "abcdefgh12345678",
                        status: { type: "busy" }
                    }
                });
            });

            act(() => {
                simulateEvent({
                    type: "session.idle",
                    properties: {
                        sessionID: "abcdefgh12345678"
                    }
                });
            });

            // Should use truncated ID when no title available
            expect(mockSendCompletionNotification).toHaveBeenCalledWith({
                title: "OpenCode",
                body: '"Session abcdefgh" has finished responding',
                onClick: expect.any(Function)
            });
        });

        it("should NOT send notification for idle event without prior busy status", () => {
            const mockNavigate = vi.fn();
            const mockGetTitle = vi.fn().mockReturnValue("Test Session");

            renderHook(
                () =>
                    useEvents({
                        navigateToSession: mockNavigate,
                        getSessionTitle: mockGetTitle
                    }),
                { wrapper: createWrapper() }
            );

            // Simulate connection open
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Send idle event directly (without prior busy)
            act(() => {
                simulateEvent({
                    type: "session.idle",
                    properties: {
                        sessionID: "session-no-busy"
                    }
                });
            });

            // Should NOT send notification
            expect(mockSendCompletionNotification).not.toHaveBeenCalled();
        });

        it("should only send notification once for a busy->idle transition", () => {
            const mockNavigate = vi.fn();
            const mockGetTitle = vi.fn().mockReturnValue("Test Session");

            renderHook(
                () =>
                    useEvents({
                        navigateToSession: mockNavigate,
                        getSessionTitle: mockGetTitle
                    }),
                { wrapper: createWrapper() }
            );

            // Simulate connection open
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Send busy
            act(() => {
                simulateEvent({
                    type: "session.status",
                    properties: {
                        sessionID: "session-once",
                        status: { type: "busy" }
                    }
                });
            });

            // Send idle twice
            act(() => {
                simulateEvent({
                    type: "session.idle",
                    properties: {
                        sessionID: "session-once"
                    }
                });
            });

            act(() => {
                simulateEvent({
                    type: "session.idle",
                    properties: {
                        sessionID: "session-once"
                    }
                });
            });

            // Should only send notification once
            expect(mockSendCompletionNotification).toHaveBeenCalledTimes(1);
        });
    });

    describe("connection management", () => {
        it("should set isConnected to true when EventSource opens", () => {
            const { result } = renderHook(() => useEvents(), {
                wrapper: createWrapper()
            });

            expect(result.current.isConnected).toBe(false);

            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            expect(result.current.isConnected).toBe(true);
        });

        it("should clear session statuses on reconnect", () => {
            const { result } = renderHook(() => useEvents(), {
                wrapper: createWrapper()
            });

            // Open connection
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Add a status
            act(() => {
                simulateEvent({
                    type: "session.status",
                    properties: {
                        sessionID: "session-123",
                        status: { type: "busy" }
                    }
                });
            });

            expect(result.current.sessionStatuses.size).toBe(1);

            // Simulate reconnect (open again)
            act(() => {
                mockEventSourceInstance.onopen?.();
            });

            // Statuses should be cleared
            expect(result.current.sessionStatuses.size).toBe(0);
        });
    });
});
