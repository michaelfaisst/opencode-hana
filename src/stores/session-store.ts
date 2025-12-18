import { create } from "zustand";

interface SessionStore {
  sessionId: string | null;
  directory: string | null;
  setSession: (sessionId: string | null, directory?: string | null) => void;
  setDirectory: (directory: string | null) => void;
  clear: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  directory: null,
  setSession: (sessionId, directory = null) => set({ sessionId, directory }),
  setDirectory: (directory) => set({ directory }),
  clear: () => set({ sessionId: null, directory: null }),
}));
