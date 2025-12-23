import { act } from "@testing-library/react";
import { useMessageQueueStore } from "../message-queue-store";

describe("useMessageQueueStore", () => {
    beforeEach(() => {
        // Reset the store before each test by clearing all queues
        act(() => {
            const state = useMessageQueueStore.getState();
            // Clear all session queues
            Object.keys(state.queues).forEach((sessionId) => {
                state.clearQueue(sessionId);
            });
        });
    });

    describe("initial state", () => {
        it("has empty queues by default", () => {
            const state = useMessageQueueStore.getState();
            expect(state.queues).toEqual({});
        });

        it("returns empty array for non-existent session queue", () => {
            const queue = useMessageQueueStore
                .getState()
                .getQueue("non-existent");
            expect(queue).toEqual([]);
        });
    });

    describe("addToQueue", () => {
        it("adds a message to a session queue", () => {
            act(() => {
                useMessageQueueStore
                    .getState()
                    .addToQueue("session-1", { text: "Hello" });
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(1);
            expect(queue[0].text).toBe("Hello");
            expect(queue[0].id).toBeDefined();
        });

        it("adds multiple messages to the same session queue", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "First" });
                store.addToQueue("session-1", { text: "Second" });
                store.addToQueue("session-1", { text: "Third" });
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(3);
            expect(queue[0].text).toBe("First");
            expect(queue[1].text).toBe("Second");
            expect(queue[2].text).toBe("Third");
        });

        it("keeps separate queues for different sessions", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "Session 1 message" });
                store.addToQueue("session-2", { text: "Session 2 message" });
            });

            const queue1 = useMessageQueueStore
                .getState()
                .getQueue("session-1");
            const queue2 = useMessageQueueStore
                .getState()
                .getQueue("session-2");

            expect(queue1).toHaveLength(1);
            expect(queue1[0].text).toBe("Session 1 message");

            expect(queue2).toHaveLength(1);
            expect(queue2[0].text).toBe("Session 2 message");
        });

        it("generates unique IDs for each message", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "First" });
                store.addToQueue("session-1", { text: "Second" });
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue[0].id).not.toBe(queue[1].id);
        });

        it("stores images with the message", () => {
            const mockImages = [
                {
                    id: "img-1",
                    file: new File([], "test.png"),
                    dataUrl: "data:image/png;base64,abc",
                    mime: "image/png"
                }
            ];

            act(() => {
                useMessageQueueStore.getState().addToQueue("session-1", {
                    text: "With image",
                    images: mockImages
                });
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue[0].images).toEqual(mockImages);
        });
    });

    describe("removeFromQueue", () => {
        it("removes a specific message from the queue", () => {
            act(() => {
                useMessageQueueStore
                    .getState()
                    .addToQueue("session-1", { text: "First" });
                useMessageQueueStore
                    .getState()
                    .addToQueue("session-1", { text: "Second" });
            });

            const messageId = useMessageQueueStore
                .getState()
                .getQueue("session-1")[0].id;

            act(() => {
                useMessageQueueStore
                    .getState()
                    .removeFromQueue("session-1", messageId);
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(1);
            expect(queue[0].text).toBe("Second");
        });

        it("does nothing when removing from non-existent session", () => {
            act(() => {
                useMessageQueueStore
                    .getState()
                    .removeFromQueue("non-existent", "some-id");
            });

            const queue = useMessageQueueStore
                .getState()
                .getQueue("non-existent");
            expect(queue).toEqual([]);
        });

        it("does nothing when message ID does not exist", () => {
            act(() => {
                useMessageQueueStore
                    .getState()
                    .addToQueue("session-1", { text: "Message" });
                useMessageQueueStore
                    .getState()
                    .removeFromQueue("session-1", "non-existent-id");
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(1);
        });
    });

    describe("popFromQueue", () => {
        it("returns and removes the first message (FIFO)", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "First" });
                store.addToQueue("session-1", { text: "Second" });
            });

            const poppedMessage = useMessageQueueStore
                .getState()
                .popFromQueue("session-1");

            expect(poppedMessage?.text).toBe("First");

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(1);
            expect(queue[0].text).toBe("Second");
        });

        it("returns undefined for empty queue", () => {
            const result = useMessageQueueStore
                .getState()
                .popFromQueue("non-existent");

            expect(result).toBeUndefined();
        });

        it("returns undefined after queue is emptied", () => {
            act(() => {
                useMessageQueueStore
                    .getState()
                    .addToQueue("session-1", { text: "Only message" });
            });

            const first = useMessageQueueStore
                .getState()
                .popFromQueue("session-1");
            const second = useMessageQueueStore
                .getState()
                .popFromQueue("session-1");

            expect(first?.text).toBe("Only message");
            expect(second).toBeUndefined();
        });
    });

    describe("getQueue", () => {
        it("returns a copy of the queue array", () => {
            act(() => {
                useMessageQueueStore
                    .getState()
                    .addToQueue("session-1", { text: "Message" });
            });

            const queue1 = useMessageQueueStore
                .getState()
                .getQueue("session-1");
            const queue2 = useMessageQueueStore
                .getState()
                .getQueue("session-1");

            // Should be equal in content
            expect(queue1).toEqual(queue2);
        });

        it("returns empty array for session with no messages", () => {
            const queue = useMessageQueueStore
                .getState()
                .getQueue("empty-session");
            expect(queue).toEqual([]);
        });
    });

    describe("clearQueue", () => {
        it("removes all messages for a session", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "First" });
                store.addToQueue("session-1", { text: "Second" });
                store.clearQueue("session-1");
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toEqual([]);
        });

        it("does not affect other sessions", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "Session 1" });
                store.addToQueue("session-2", { text: "Session 2" });
                store.clearQueue("session-1");
            });

            const queue1 = useMessageQueueStore
                .getState()
                .getQueue("session-1");
            const queue2 = useMessageQueueStore
                .getState()
                .getQueue("session-2");

            expect(queue1).toEqual([]);
            expect(queue2).toHaveLength(1);
            expect(queue2[0].text).toBe("Session 2");
        });

        it("removes session key from queues object", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "Message" });
                store.clearQueue("session-1");
            });

            const state = useMessageQueueStore.getState();
            expect("session-1" in state.queues).toBe(false);
        });

        it("does nothing for non-existent session", () => {
            act(() => {
                useMessageQueueStore.getState().clearQueue("non-existent");
            });

            // Should not throw
            const state = useMessageQueueStore.getState();
            expect(state.queues).toEqual({});
        });
    });

    describe("integration scenarios", () => {
        it("handles typical message queue workflow", () => {
            // User sends messages while AI is busy
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "First question" });
                store.addToQueue("session-1", { text: "Follow up" });
            });

            // AI finishes, process first message
            const firstMessage = useMessageQueueStore
                .getState()
                .popFromQueue("session-1");
            expect(firstMessage?.text).toBe("First question");

            // Check remaining queue
            let queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(1);

            // AI finishes again, process second message
            const secondMessage = useMessageQueueStore
                .getState()
                .popFromQueue("session-1");
            expect(secondMessage?.text).toBe("Follow up");

            // Queue should be empty
            queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(0);
        });

        it("handles user cancelling a queued message", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-1", { text: "Keep this" });
                store.addToQueue("session-1", { text: "Remove this" });
                store.addToQueue("session-1", { text: "Keep this too" });
            });

            const messageToRemove = useMessageQueueStore
                .getState()
                .getQueue("session-1")[1].id;

            act(() => {
                useMessageQueueStore
                    .getState()
                    .removeFromQueue("session-1", messageToRemove);
            });

            const queue = useMessageQueueStore.getState().getQueue("session-1");
            expect(queue).toHaveLength(2);
            expect(queue[0].text).toBe("Keep this");
            expect(queue[1].text).toBe("Keep this too");
        });

        it("handles session deletion clearing its queue", () => {
            act(() => {
                const store = useMessageQueueStore.getState();
                store.addToQueue("session-to-delete", { text: "Message 1" });
                store.addToQueue("session-to-delete", { text: "Message 2" });
                store.addToQueue("other-session", { text: "Other message" });

                // Simulate session deletion
                store.clearQueue("session-to-delete");
            });

            const deletedQueue = useMessageQueueStore
                .getState()
                .getQueue("session-to-delete");
            const otherQueue = useMessageQueueStore
                .getState()
                .getQueue("other-session");

            expect(deletedQueue).toEqual([]);
            expect(otherQueue).toHaveLength(1);
        });
    });
});
