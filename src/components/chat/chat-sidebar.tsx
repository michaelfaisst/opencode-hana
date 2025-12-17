import { useMemo, useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { COMMANDS, type Command } from "@/hooks/use-commands";
import {
  SidebarActions,
  SidebarSessionInfo,
  SidebarContextUsage,
  SidebarChangedFiles,
  SidebarTasks,
  SidebarMcpServers,
  type TodoItem,
  type ChangedFile,
  type SessionStats,
  type ContextUsageData,
} from "./sidebar";
import { useMcpServers } from "@/hooks";

interface TokenInfo {
  input: number;
  output: number;
  reasoning: number;
  cache: {
    read: number;
    write: number;
  };
}

interface Part {
  type: string;
  tool?: string;
  state?: {
    input?: {
      todos?: TodoItem[];
    };
  };
  [key: string]: unknown;
}

interface Message {
  role: string;
  parts: Part[];
  tokens?: TokenInfo;
  cost?: number;
}

interface ChatSidebarProps {
  messages: Message[];
  contextLimit?: number;
  className?: string;
  onCommand?: (command: Command) => void;
  hasSession?: boolean;
  isBusy?: boolean;
}

export function ChatSidebar({
  messages,
  contextLimit,
  className,
  onCommand,
  hasSession = false,
  isBusy = false,
}: ChatSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { data: mcpServers = [], isLoading: isMcpLoading } = useMcpServers();

  // Extract the latest todos from todowrite tool calls
  const todos = useMemo(() => {
    let latestTodos: TodoItem[] = [];

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        if (
          part.type === "tool" &&
          part.tool === "todowrite" &&
          part.state?.input?.todos
        ) {
          latestTodos = part.state.input.todos;
        }
      }
    }

    return latestTodos;
  }, [messages]);

  // Extract changed files from edit/write/delete tool calls
  const changedFiles = useMemo(() => {
    const filesMap = new Map<string, ChangedFile>();

    // Helper to count lines in a string
    const countLines = (str: string): number => {
      if (!str) return 0;
      return str.split("\n").length;
    };

    for (const message of messages) {
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        if (part.type !== "tool") continue;

        const tool = part.tool as string;
        const state = part.state as
          | { status?: string; input?: Record<string, unknown> }
          | undefined;

        // Handle edit tool
        if (tool === "edit" && state?.input) {
          const filePath = state.input.filePath as string | undefined;
          const oldString = (state.input.oldString as string) || "";
          const newString = (state.input.newString as string) || "";

          if (filePath) {
            const oldLines = countLines(oldString);
            const newLines = countLines(newString);

            // Get existing entry to accumulate changes
            const existing = filesMap.get(filePath);

            filesMap.set(filePath, {
              path: filePath,
              operation: "edit",
              status: (state.status as ChangedFile["status"]) || "pending",
              additions: (existing?.additions || 0) + newLines,
              deletions: (existing?.deletions || 0) + oldLines,
            });
          }
        }

        // Handle write tool
        if (tool === "write" && state?.input) {
          const filePath = state.input.filePath as string | undefined;
          const content = (state.input.content as string) || "";

          if (filePath) {
            const lines = countLines(content);
            const existing = filesMap.get(filePath);

            filesMap.set(filePath, {
              path: filePath,
              operation: existing ? "edit" : "write", // If file was edited before, keep as edit
              status: (state.status as ChangedFile["status"]) || "pending",
              additions: (existing?.additions || 0) + lines,
              deletions: existing?.deletions || 0,
            });
          }
        }

        // Handle bash commands that might delete files (rm command detection)
        if (tool === "bash" && state?.input) {
          const command = state.input.command as string | undefined;
          if (command && (command.includes("rm ") || command.includes("rm\t"))) {
            // Try to extract file path from rm command - basic detection
            const rmMatch = command.match(
              /rm\s+(?:-[rf]+\s+)?["']?([^\s"']+)["']?/
            );
            if (rmMatch && rmMatch[1]) {
              const filePath = rmMatch[1];
              filesMap.set(filePath, {
                path: filePath,
                operation: "delete",
                status: (state.status as ChangedFile["status"]) || "pending",
                additions: 0,
                deletions: 0, // We don't know original file size
              });
            }
          }
        }
      }
    }

    return Array.from(filesMap.values());
  }, [messages]);

  // Calculate message stats and token usage
  const stats = useMemo((): SessionStats => {
    let userMessages = 0;
    let assistantMessages = 0;
    let toolCalls = 0;
    let totalCost = 0;
    let currentContextTokens = 0;

    for (const message of messages) {
      if (message.role === "user") {
        userMessages++;
      } else if (message.role === "assistant") {
        assistantMessages++;
        for (const part of message.parts) {
          if (part.type === "tool") {
            toolCalls++;
          }
        }
        // Track the context tokens (input + cache.read) from the last message with tokens
        if (message.tokens) {
          const contextTokens =
            message.tokens.input + (message.tokens.cache?.read || 0);
          if (contextTokens > 0) {
            currentContextTokens = contextTokens;
          }
        }
        if (message.cost) {
          totalCost += message.cost;
        }
      }
    }

    return {
      userMessages,
      assistantMessages,
      toolCalls,
      totalCost,
      currentContextTokens,
    };
  }, [messages]);

  // Calculate context usage percentage based on current context (not cumulative)
  const contextUsage = useMemo((): ContextUsageData | null => {
    if (!contextLimit || stats.currentContextTokens === 0) return null;
    const percentage = (stats.currentContextTokens / contextLimit) * 100;
    return {
      percentage: Math.min(percentage, 100),
      isHigh: percentage > 80,
      isCritical: percentage > 95,
      currentTokens: stats.currentContextTokens,
    };
  }, [contextLimit, stats.currentContextTokens]);

  // Filter toolbar commands
  const toolbarCommands = COMMANDS.filter((cmd) => cmd.showInToolbar);
  const hasMessages = messages.length > 0;

  // Check if a command should be disabled
  const isCommandDisabled = (command: Command): boolean => {
    if (isBusy) return true;
    if (command.requiresSession && !hasSession) return true;
    if (command.requiresMessages && !hasMessages) return true;
    return false;
  };

  // Collapsed state - just show toggle button
  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex flex-col h-full bg-muted/30 border-l border-border w-10 transition-all duration-200",
          className
        )}
      >
        <div className="p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="h-6 w-6"
            title="Expand sidebar"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-muted/30 border-l border-border w-72 transition-all duration-200",
        className
      )}
    >
      {/* Header with collapse button */}
      <div className="flex items-center justify-between p-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground px-2">
          Sidebar
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(true)}
          className="h-6 w-6"
          title="Collapse sidebar"
        >
          <PanelRightOpen className="h-4 w-4" />
        </Button>
      </div>

      {/* Actions Section */}
      {onCommand && (
        <SidebarActions
          commands={toolbarCommands}
          onCommand={onCommand}
          isCommandDisabled={isCommandDisabled}
        />
      )}

      {/* Session Info */}
      <SidebarSessionInfo stats={stats} />

      {/* Context Usage */}
      <SidebarContextUsage
        contextUsage={contextUsage}
        contextLimit={contextLimit}
      />

      {/* Changed Files */}
      <SidebarChangedFiles files={changedFiles} />

      {/* MCP Servers */}
      <SidebarMcpServers servers={mcpServers} isLoading={isMcpLoading} />

      {/* Tasks */}
      <SidebarTasks todos={todos} />
    </div>
  );
}
