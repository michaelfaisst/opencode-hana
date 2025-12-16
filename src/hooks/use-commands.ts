import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOpencodeClient } from "@/providers";
import { QUERY_KEYS } from "@/lib/constants";
import { getWebSessionInfo } from "./use-sessions";
import {
  Plus,
  Undo2,
  Redo2,
  FileSearch,
  Minimize2,
  Copy,
  Share2,
  Pencil,
  type LucideIcon,
} from "lucide-react";

/**
 * Command definition for slash commands
 */
export interface Command {
  /** Unique command name (used after /) */
  name: string;
  /** Display label */
  label: string;
  /** Brief description */
  description: string;
  /** Icon component */
  icon: LucideIcon;
  /** Keyboard shortcut hint (optional) */
  shortcut?: string;
  /** Whether the command requires a session to be active */
  requiresSession: boolean;
  /** Whether the command requires messages in the session */
  requiresMessages?: boolean;
  /** Whether the command can be shown as a toolbar button */
  showInToolbar: boolean;
  /** Whether the command opens a dialog (prevents refocusing input) */
  opensDialog?: boolean;
}

/**
 * All available commands
 */
export const COMMANDS: Command[] = [
  {
    name: "new",
    label: "New Session",
    description: "Start a new chat session",
    icon: Plus,
    requiresSession: false,
    showInToolbar: true,
  },
  {
    name: "undo",
    label: "Undo",
    description: "Undo the last message",
    icon: Undo2,
    requiresSession: true,
    requiresMessages: true,
    showInToolbar: true,
  },
  {
    name: "redo",
    label: "Redo",
    description: "Redo the last message",
    icon: Redo2,
    requiresSession: true,
    requiresMessages: true,
    showInToolbar: true,
  },
  {
    name: "review",
    label: "Code Review",
    description: "Request a code review of changes",
    icon: FileSearch,
    requiresSession: true,
    showInToolbar: true,
  },
  {
    name: "compact",
    label: "Compact",
    description: "Summarize session to reduce context",
    icon: Minimize2,
    requiresSession: true,
    requiresMessages: true,
    showInToolbar: true,
  },
  {
    name: "copy",
    label: "Copy",
    description: "Copy session content to clipboard",
    icon: Copy,
    requiresSession: true,
    showInToolbar: false,
  },
  {
    name: "export",
    label: "Export",
    description: "Export session transcript to a file",
    icon: Share2,
    requiresSession: true,
    showInToolbar: false,
  },
  {
    name: "rename",
    label: "Rename",
    description: "Rename the current session",
    icon: Pencil,
    requiresSession: true,
    showInToolbar: true,
    opensDialog: true,
  },
];

/**
 * Get commands filtered by search query
 */
export function filterCommands(query: string): Command[] {
  if (!query) return COMMANDS;
  const lowerQuery = query.toLowerCase();
  return COMMANDS.filter(
    (cmd) =>
      cmd.name.toLowerCase().includes(lowerQuery) ||
      cmd.label.toLowerCase().includes(lowerQuery) ||
      cmd.description.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Hook to revert (undo) file changes
 */
export function useRevertSession() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      messageId,
      partId,
    }: {
      sessionId: string;
      messageId: string;
      partId?: string;
    }) => {
      const sessionInfo = getWebSessionInfo(sessionId);
      const response = await client.session.revert({
        path: { id: sessionId },
        query: { directory: sessionInfo?.directory },
        body: { messageID: messageId, partID: partId },
      });
      if (response.error) {
        throw new Error("Failed to revert changes");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.session(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(variables.sessionId),
      });
    },
  });
}

/**
 * Hook to unrevert (redo) file changes
 */
export function useUnrevertSession() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const sessionInfo = getWebSessionInfo(sessionId);
      const response = await client.session.unrevert({
        path: { id: sessionId },
        query: { directory: sessionInfo?.directory },
      });
      if (response.error) {
        throw new Error("Failed to restore changes");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.session(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(variables.sessionId),
      });
    },
  });
}

/**
 * Hook to compact/summarize session
 */
export function useCompactSession() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      providerId,
      modelId,
    }: {
      sessionId: string;
      providerId: string;
      modelId: string;
    }) => {
      const sessionInfo = getWebSessionInfo(sessionId);
      const response = await client.session.summarize({
        path: { id: sessionId },
        query: { directory: sessionInfo?.directory },
        body: { providerID: providerId, modelID: modelId },
      });
      if (response.error) {
        throw new Error("Failed to compact session");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.session(variables.sessionId),
      });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(variables.sessionId),
      });
    },
  });
}

/**
 * Hook to execute a session command (like /review)
 */
export function useSessionCommand() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      command,
      args,
    }: {
      sessionId: string;
      command: string;
      args?: string;
    }) => {
      const sessionInfo = getWebSessionInfo(sessionId);
      const response = await client.session.command({
        path: { id: sessionId },
        query: { directory: sessionInfo?.directory },
        body: { command, arguments: args || "" },
      });
      if (response.error) {
        throw new Error(`Failed to execute command: ${command}`);
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.messages(variables.sessionId),
      });
    },
  });
}

/**
 * Hook to share a session (creates a shareable URL)
 */
export function useShareSession() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const sessionInfo = getWebSessionInfo(sessionId);
      const response = await client.session.share({
        path: { id: sessionId },
        query: { directory: sessionInfo?.directory },
      });
      if (response.error) {
        throw new Error("Failed to share session");
      }
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.session(variables.sessionId),
      });
    },
  });
}

/**
 * Hook to get session messages (for copy functionality)
 */
export function useCopySession() {
  const client = useOpencodeClient();

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string }) => {
      const sessionInfo = getWebSessionInfo(sessionId);
      const response = await client.session.messages({
        path: { id: sessionId },
        query: { directory: sessionInfo?.directory },
      });
      if (response.error) {
        throw new Error("Failed to get session messages");
      }

      // Format messages for clipboard
      const messages = response.data || [];
      const formatted = messages
        .map((msg) => {
          const role = msg.info.role === "user" ? "User" : "Assistant";
          const content = msg.parts
            .map((part) => {
              if (part.type === "text") {
                return part.text;
              }
              if (part.type === "tool") {
                return `[Tool: ${part.tool}]`;
              }
              return "";
            })
            .filter(Boolean)
            .join("\n");
          return `## ${role}\n\n${content}`;
        })
        .join("\n\n---\n\n");

      // Copy to clipboard
      await navigator.clipboard.writeText(formatted);
      return { copied: true, messageCount: messages.length };
    },
  });
}

/**
 * Hook to export session transcript to a file
 */
export function useExportSession() {
  const client = useOpencodeClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      sessionTitle,
    }: {
      sessionId: string;
      sessionTitle?: string;
    }) => {
      const sessionInfo = getWebSessionInfo(sessionId);
      const response = await client.session.messages({
        path: { id: sessionId },
        query: { directory: sessionInfo?.directory },
      });
      if (response.error) {
        throw new Error("Failed to get session messages");
      }

      // Format messages for export
      const messages = response.data || [];
      const title = sessionTitle || `Session ${sessionId.slice(0, 8)}`;
      const exportDate = new Date().toISOString();

      const formatted = [
        `# ${title}`,
        ``,
        `*Exported on ${new Date(exportDate).toLocaleString()}*`,
        ``,
        `---`,
        ``,
        ...messages.map((msg) => {
          const role = msg.info.role === "user" ? "User" : "Assistant";
          const content = msg.parts
            .map((part) => {
              if (part.type === "text") {
                return part.text;
              }
              if (part.type === "tool") {
                return `\`[Tool: ${part.tool}]\``;
              }
              return "";
            })
            .filter(Boolean)
            .join("\n");
          return `## ${role}\n\n${content}\n\n---\n`;
        }),
      ].join("\n");

      // Create and download the file
      const blob = new Blob([formatted], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}-${sessionId.slice(0, 8)}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { exported: true, messageCount: messages.length };
    },
  });
}
