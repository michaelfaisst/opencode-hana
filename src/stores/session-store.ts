import { create } from "zustand";

export interface SessionError {
    message: string;
    code?: string;
    timestamp: number;
}

interface SessionStore {
    sessionId: string | null;
    directory: string | null;
    error: SessionError | null;
    setSession: (sessionId: string | null, directory?: string | null) => void;
    setDirectory: (directory: string | null) => void;
    setError: (error: SessionError | null) => void;
    clearError: () => void;
    clear: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
    sessionId: null,
    directory: null,
    error: null,
    setSession: (sessionId, directory = null) =>
        set({ sessionId, directory, error: null }),
    setDirectory: (directory) => set({ directory }),
    setError: (error) => set({ error }),
    clearError: () => set({ error: null }),
    clear: () => set({ sessionId: null, directory: null, error: null })
}));
