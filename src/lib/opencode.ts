import { createOpencodeClient } from "@opencode-ai/sdk/client";

// In development, use relative URLs to go through Vite proxy
// In production, use the configured server URL or same origin
const serverUrl = import.meta.env.VITE_OPENCODE_SERVER_URL || "";

console.log("[opencode] serverUrl:", serverUrl, "location:", typeof window !== 'undefined' ? window.location.origin : 'no window');

export const opencodeClient = createOpencodeClient({
  baseUrl: serverUrl,
});

export type { Session, Message, Part } from "@opencode-ai/sdk/client";
