export const QUERY_KEYS = {
    sessions: ["sessions"] as const,
    session: (id: string) => ["session", id] as const,
    messages: (sessionId: string) => ["messages", sessionId] as const,
    providers: ["providers"] as const,
    projects: ["projects"] as const,
    config: ["config"] as const,
    mcpServers: ["mcpServers"] as const
} as const;
