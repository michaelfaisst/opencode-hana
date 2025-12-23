/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from "react";
import { useEvents, type UseEventsOptions } from "@/hooks/use-events";
import type { SessionStatus } from "@opencode-ai/sdk/client";

interface EventsContextValue {
    isConnected: boolean;
    sessionStatuses: Map<string, SessionStatus>;
    reconnect: () => void;
    disconnect: () => void;
    setSessionBusy: (sessionId: string) => void;
    setSessionIdle: (sessionId: string) => void;
}

const EventsContext = createContext<EventsContextValue | null>(null);

interface EventsProviderProps extends UseEventsOptions {
    children: ReactNode;
}

export function EventsProvider({
    children,
    navigateToSession,
    getSessionTitle
}: EventsProviderProps) {
    const events = useEvents({ navigateToSession, getSessionTitle });

    return (
        <EventsContext.Provider value={events}>
            {children}
        </EventsContext.Provider>
    );
}

export function useEventsContext() {
    const context = useContext(EventsContext);
    if (!context) {
        throw new Error(
            "useEventsContext must be used within an EventsProvider"
        );
    }
    return context;
}

export function useSessionStatusFromContext(sessionId: string) {
    const { sessionStatuses, isConnected, setSessionBusy, setSessionIdle } =
        useEventsContext();
    const status = sessionStatuses.get(sessionId) ?? { type: "idle" as const };

    return {
        status,
        isConnected,
        // isBusy is true when status is "busy" or "retry" - basically when not idle
        isBusy: status.type === "busy" || status.type === "retry",
        isRetrying: status.type === "retry",
        isIdle: status.type === "idle",
        setSessionBusy,
        setSessionIdle
    };
}
