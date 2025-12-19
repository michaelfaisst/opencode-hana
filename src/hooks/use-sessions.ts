import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOpencodeClient } from "@/providers";
import { QUERY_KEYS } from "@/lib/constants";

const WEB_SESSIONS_KEY = "opencode-hana-sessions-v2";

interface WebSessionInfo {
  id: string;
  directory: string;
}

/**
 * Get the map of session IDs to their directories created by the web app
 */
function getWebSessions(): Map<string, WebSessionInfo> {
  try {
    const stored = localStorage.getItem(WEB_SESSIONS_KEY);
    if (stored) {
      const sessions: WebSessionInfo[] = JSON.parse(stored);
      return new Map(sessions.map((s) => [s.id, s]));
    }
  } catch {
    // Ignore parse errors
  }
  return new Map();
}

/**
 * Get session info by ID
 */
export function getWebSessionInfo(id: string): WebSessionInfo | undefined {
  return getWebSessions().get(id);
}

/**
 * Add a session to the web sessions list
 */
function addWebSession(id: string, directory: string): void {
  try {
    const sessions = getWebSessions();
    sessions.set(id, { id, directory });
    localStorage.setItem(WEB_SESSIONS_KEY, JSON.stringify([...sessions.values()]));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Remove a session from the web sessions list
 */
export function removeWebSessionId(id: string): void {
  try {
    const sessions = getWebSessions();
    sessions.delete(id);
    localStorage.setItem(WEB_SESSIONS_KEY, JSON.stringify([...sessions.values()]));
  } catch {
    // Ignore storage errors
  }
}

export function useSessions() {
  const client = useOpencodeClient();

  return useQuery({
    queryKey: QUERY_KEYS.sessions,
    queryFn: async () => {
      // Get all web sessions grouped by directory
      const webSessions = getWebSessions();

      if (webSessions.size === 0) {
        return [];
      }

      // Get unique directories
      const directories = new Set<string>();
      for (const session of webSessions.values()) {
        directories.add(session.directory);
      }

      // Fetch sessions from each directory in parallel
      const results = await Promise.all(
        Array.from(directories).map(async (directory) => {
          try {
            const response = await client.session.list({
              query: { directory },
            });
            if (response.error) {
              console.warn(`Failed to fetch sessions for directory: ${directory}`);
              return [];
            }
            return response.data ?? [];
          } catch (error) {
            console.warn(`Error fetching sessions for directory: ${directory}`, error);
            return [];
          }
        })
      );

      // Flatten and filter to only sessions created by the web app
      const allSessions = results.flat();
      return allSessions.filter((session) => webSessions.has(session.id));
    },
  });
}

export class SessionNotFoundError extends Error {
  sessionId: string;

  constructor(sessionId: string) {
    super(`Session not found: ${sessionId}`);
    this.name = "SessionNotFoundError";
    this.sessionId = sessionId;
  }
}

export function useSession(id: string) {
  const client = useOpencodeClient();

  return useQuery({
    queryKey: QUERY_KEYS.session(id),
    queryFn: async () => {
      const sessionInfo = getWebSessionInfo(id);
      const response = await client.session.get({
        path: { id },
        query: { directory: sessionInfo?.directory },
      });
      if (response.error) {
        // Check if it's a 404/NotFound error
        const status = (response.error as { status?: number }).status;
        if (status === 404) {
          // Clean up the stale session ID from localStorage
          removeWebSessionId(id);
          throw new SessionNotFoundError(id);
        }
        throw new Error("Failed to fetch session");
      }
      return response.data;
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      // Don't retry if the session was not found
      if (error instanceof SessionNotFoundError) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useCreateSession() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, directory }: { title?: string; directory: string }) => {
      const response = await client.session.create({
        body: { title },
        query: { directory },
      });
      if (response.error) {
        throw new Error("Failed to create session");
      }
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Store the session ID and directory in localStorage so we know it's a web session
      if (data?.id) {
        addWebSession(data.id, variables.directory);
      }
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
  });
}

export function useDeleteSession() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const sessionInfo = getWebSessionInfo(id);
      const response = await client.session.delete({
        path: { id },
        query: { directory: sessionInfo?.directory },
      });
      if (response.error) {
        throw new Error("Failed to delete session");
      }
      // Remove from localStorage
      removeWebSessionId(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
    },
  });
}

export function useRenameSession() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      const sessionInfo = getWebSessionInfo(id);
      const response = await client.session.update({
        path: { id },
        query: { directory: sessionInfo?.directory },
        body: { title },
      });
      if (response.error) {
        throw new Error("Failed to rename session");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.sessions });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.session(variables.id) });
    },
  });
}
