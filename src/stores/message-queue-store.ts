import { create } from "zustand";
import type { ImageAttachment } from "@/hooks/use-messages";

export interface QueuedMessage {
    id: string;
    text: string;
    images?: ImageAttachment[];
}

interface MessageQueueStore {
    // State: Record of sessionId -> queued messages
    queues: Record<string, QueuedMessage[]>;

    // Actions
    addToQueue: (sessionId: string, message: Omit<QueuedMessage, "id">) => void;
    removeFromQueue: (sessionId: string, messageId: string) => void;
    getQueue: (sessionId: string) => QueuedMessage[];
    popFromQueue: (sessionId: string) => QueuedMessage | undefined;
    clearQueue: (sessionId: string) => void;
}

export const useMessageQueueStore = create<MessageQueueStore>((set, get) => ({
    queues: {},

    addToQueue: (sessionId, message) => {
        const newMessage: QueuedMessage = {
            id: crypto.randomUUID(),
            ...message
        };
        set((state) => ({
            queues: {
                ...state.queues,
                [sessionId]: [...(state.queues[sessionId] || []), newMessage]
            }
        }));
    },

    removeFromQueue: (sessionId, messageId) => {
        set((state) => ({
            queues: {
                ...state.queues,
                [sessionId]: (state.queues[sessionId] || []).filter(
                    (m) => m.id !== messageId
                )
            }
        }));
    },

    getQueue: (sessionId) => {
        return get().queues[sessionId] || [];
    },

    popFromQueue: (sessionId) => {
        const queue = get().queues[sessionId] || [];
        if (queue.length === 0) return undefined;

        const [first, ...rest] = queue;
        set((state) => ({
            queues: {
                ...state.queues,
                [sessionId]: rest
            }
        }));
        return first;
    },

    clearQueue: (sessionId) => {
        set((state) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { [sessionId]: _, ...rest } = state.queues;
            return { queues: rest };
        });
    }
}));
