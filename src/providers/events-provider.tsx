import { createContext, useContext, type ReactNode } from "react";
import { useEvents } from "@/hooks/use-events";
import type { SessionStatus } from "@opencode-ai/sdk/client";

interface EventsContextValue {
  isConnected: boolean;
  sessionStatuses: Map<string, SessionStatus>;
  reconnect: () => void;
  disconnect: () => void;
}

const EventsContext = createContext<EventsContextValue | null>(null);

interface EventsProviderProps {
  children: ReactNode;
}

export function EventsProvider({ children }: EventsProviderProps) {
  const events = useEvents();

  return (
    <EventsContext.Provider value={events}>{children}</EventsContext.Provider>
  );
}

export function useEventsContext() {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error("useEventsContext must be used within an EventsProvider");
  }
  return context;
}

export function useSessionStatusFromContext(sessionId: string) {
  const { sessionStatuses, isConnected } = useEventsContext();
  const status = sessionStatuses.get(sessionId) ?? { type: "idle" as const };

  return {
    status,
    isConnected,
    isBusy: status.type === "busy",
    isRetrying: status.type === "retry",
    isIdle: status.type === "idle",
  };
}
