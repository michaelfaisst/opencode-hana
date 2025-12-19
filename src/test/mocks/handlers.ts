import { http, HttpResponse } from "msw";
import {
    mockProjects,
    mockSessions,
    mockMessages,
    mockProviders,
    mockConfig
} from "./data";

/**
 * MSW request handlers for mocking the OpenCode API
 * These handlers ensure no real API calls are made during tests
 */
export const handlers = [
    // Projects
    http.get("/project", () => {
        return HttpResponse.json(mockProjects);
    }),

    http.get("/project/current", () => {
        return HttpResponse.json(mockProjects[0]);
    }),

    // Sessions
    http.get("/session", () => {
        return HttpResponse.json(mockSessions);
    }),

    http.get("/session/:id", ({ params }) => {
        const session = mockSessions.find((s) => s.id === params.id);
        if (session) {
            return HttpResponse.json(session);
        }
        return HttpResponse.json(
            { error: "Session not found" },
            { status: 404 }
        );
    }),

    http.post("/session", () => {
        return HttpResponse.json({
            id: "new-session-id",
            title: "New Session",
            time: { created: Date.now() }
        });
    }),

    http.delete("/session/:id", () => {
        return HttpResponse.json({ success: true });
    }),

    http.patch("/session/:id", () => {
        return HttpResponse.json({ success: true });
    }),

    // Messages
    http.get("/session/:id/message", () => {
        return HttpResponse.json(mockMessages);
    }),

    http.post("/session/:id/message", () => {
        return HttpResponse.json({ success: true });
    }),

    // Session actions
    http.post("/session/:id/revert", () => {
        return HttpResponse.json({ success: true });
    }),

    http.post("/session/:id/unrevert", () => {
        return HttpResponse.json({ success: true });
    }),

    http.post("/session/:id/summarize", () => {
        return HttpResponse.json({ success: true });
    }),

    http.post("/session/:id/command", () => {
        return HttpResponse.json({ success: true });
    }),

    http.post("/session/:id/share", () => {
        return HttpResponse.json({ url: "https://example.com/shared/abc123" });
    }),

    // Providers
    http.get("/provider", () => {
        return HttpResponse.json(mockProviders);
    }),

    // Config
    http.get("/config", () => {
        return HttpResponse.json(mockConfig);
    }),

    // File operations
    http.get("/file", () => {
        return HttpResponse.json({ content: "// file content" });
    }),

    http.get("/find", () => {
        return HttpResponse.json([
            { path: "/src/index.ts", type: "file" },
            { path: "/src/app.tsx", type: "file" }
        ]);
    }),

    // Events (SSE) - return empty for tests
    http.get("/event", () => {
        return new HttpResponse(null, { status: 204 });
    }),

    http.get("/global/event", () => {
        return new HttpResponse(null, { status: 204 });
    })
];
