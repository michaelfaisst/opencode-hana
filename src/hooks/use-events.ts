import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/constants";
import type { Event, Session, Message, Part, SessionStatus } from "@opencode-ai/sdk/client";

interface EventState {
  isConnected: boolean;
  sessionStatuses: Map<string, SessionStatus>;
}

export interface EventsHookResult {
  isConnected: boolean;
  sessionStatuses: Map<string, SessionStatus>;
  reconnect: () => void;
  disconnect: () => void;
  setSessionBusy: (sessionId: string) => void;
}

// Trailing throttle - ensures a final call after the delay
// This is important for streaming: we want updates during streaming AND a final update
function createTrailingThrottle(delay: number) {
  const state = new Map<string, { timeout: ReturnType<typeof setTimeout> | null; pending: boolean }>();
  
  return (key: string, fn: () => void) => {
    let entry = state.get(key);
    
    if (!entry) {
      entry = { timeout: null, pending: false };
      state.set(key, entry);
    }
    
    // If we're in the cooldown period, mark as pending
    if (entry.timeout) {
      entry.pending = true;
      return;
    }
    
    // Execute immediately
    fn();
    
    // Set cooldown
    entry.timeout = setTimeout(() => {
      const e = state.get(key);
      if (e) {
        // If there was a pending call, execute it
        if (e.pending) {
          e.pending = false;
          fn();
        }
        e.timeout = null;
      }
    }, delay);
  };
}

/**
 * Hook to subscribe to OpenCode server events via SSE
 * Uses native EventSource for reliable browser SSE handling
 * Automatically invalidates queries when relevant events are received
 */
export function useEvents(): EventsHookResult {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [state, setState] = useState<EventState>({
    isConnected: false,
    sessionStatuses: new Map(),
  });

  // Use ref for queryClient to avoid reconnection loops
  const queryClientRef = useRef(queryClient);
  useEffect(() => {
    queryClientRef.current = queryClient;
  }, [queryClient]);

  // Throttle for message updates - limit to once per 200ms per session
  // Uses trailing throttle to ensure final update is always applied
  const messageThrottleRef = useRef(createTrailingThrottle(200));

  const handleEvent = useCallback((event: Event) => {
    const qc = queryClientRef.current;
    const throttle = messageThrottleRef.current;
    
    switch (event.type) {
      // Session events
      case "session.created":
      case "session.updated":
      case "session.deleted":
        qc.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
        if ("info" in event.properties) {
          const session = event.properties.info as Session;
          qc.invalidateQueries({
            queryKey: QUERY_KEYS.session(session.id),
          });
        }
        break;

      // Message events
      case "message.updated":
        if ("info" in event.properties) {
          const message = event.properties.info as Message;
          qc.invalidateQueries({
            queryKey: QUERY_KEYS.messages(message.sessionID),
            refetchType: "all",
          });
        }
        break;

      case "message.removed":
        if ("sessionID" in event.properties) {
          qc.invalidateQueries({
            queryKey: QUERY_KEYS.messages(event.properties.sessionID),
            refetchType: "all",
          });
        }
        break;

      // Message part events (for streaming) - throttled to avoid spam
      case "message.part.updated":
        if ("part" in event.properties) {
          const part = event.properties.part as Part;
          throttle(`messages:${part.sessionID}`, () => {
            qc.invalidateQueries({
              queryKey: QUERY_KEYS.messages(part.sessionID),
            });
          });
        }
        break;

      case "message.part.removed":
        if ("sessionID" in event.properties) {
          throttle(`messages:${event.properties.sessionID}`, () => {
            qc.invalidateQueries({
              queryKey: QUERY_KEYS.messages(event.properties.sessionID),
            });
          });
        }
        break;

      // Session status events
      case "session.status":
        if ("sessionID" in event.properties && "status" in event.properties) {
          setState((prev) => {
            const newStatuses = new Map(prev.sessionStatuses);
            newStatuses.set(
              event.properties.sessionID,
              event.properties.status
            );
            return { ...prev, sessionStatuses: newStatuses };
          });
        }
        break;

      case "session.idle":
        if ("sessionID" in event.properties) {
          setState((prev) => {
            const newStatuses = new Map(prev.sessionStatuses);
            newStatuses.set(event.properties.sessionID, { type: "idle" });
            return { ...prev, sessionStatuses: newStatuses };
          });
          // Refresh messages when session becomes idle
          qc.invalidateQueries({
            queryKey: QUERY_KEYS.messages(event.properties.sessionID),
          });
        }
        break;

      // Session compaction
      case "session.compacted":
        if ("sessionID" in event.properties) {
          qc.invalidateQueries({
            queryKey: QUERY_KEYS.messages(event.properties.sessionID),
          });
        }
        break;

      // Config/provider updates
      case "lsp.updated":
        qc.invalidateQueries({ queryKey: QUERY_KEYS.providers });
        qc.invalidateQueries({ queryKey: QUERY_KEYS.config });
        break;

      // Server connection event
      case "server.connected":
        break;

      default:
        // Unhandled events are silently ignored
    }
  }, []);

  const connect = useCallback(() => {
    // Clear any pending reconnect
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    // Use /global/event to receive events from all directories
    const eventSource = new EventSource("/global/event");
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      // Clear all session statuses on reconnect - assume idle until we hear otherwise
      // This prevents stale "busy" states from persisting after reconnection
      setState({ isConnected: true, sessionStatuses: new Map() });
    };

    eventSource.onmessage = (event) => {
      try {
        // GlobalEvent wraps the actual event with a directory field
        const globalEvent = JSON.parse(event.data) as { directory: string; payload: Event };
        handleEvent(globalEvent.payload);
      } catch {
        // Silently ignore parse errors
      }
    };

    eventSource.onerror = (error) => {
      console.error("[Events] Connection error:", error);
      setState((prev) => ({ ...prev, isConnected: false }));
      
      // Close the connection
      eventSource.close();
      eventSourceRef.current = null;
      
      // Auto-reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };
  }, [handleEvent]);

  const disconnect = useCallback(() => {
    // Clear reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setState((prev) => ({ ...prev, isConnected: false }));
  }, []);

  // Function to manually set a session as busy (called when sending a message)
  const setSessionBusy = useCallback((sessionId: string) => {
    setState((prev) => {
      const newStatuses = new Map(prev.sessionStatuses);
      newStatuses.set(sessionId, { type: "busy" });
      return { ...prev, sessionStatuses: newStatuses };
    });
  }, []);

  // Connect once on mount, cleanup on unmount
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isConnected: state.isConnected,
    sessionStatuses: state.sessionStatuses,
    reconnect: connect,
    disconnect,
    setSessionBusy,
  };
}

// Note: useSessionStatus has been moved to events-provider.tsx as useSessionStatusFromContext
// to properly use the shared context instead of creating new SSE connections.
// Import it from "@/providers" instead.
