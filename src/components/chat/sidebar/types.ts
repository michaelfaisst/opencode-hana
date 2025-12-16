import type { Command } from "@/hooks/use-commands";

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
}

export interface ChangedFile {
  path: string;
  operation: "edit" | "write" | "delete";
  status: "pending" | "running" | "completed" | "error";
  additions: number;
  deletions: number;
}

export interface TokenInfo {
  input: number;
  output: number;
  reasoning: number;
  cache: {
    read: number;
    write: number;
  };
}

export interface Part {
  type: string;
  tool?: string;
  state?: {
    input?: {
      todos?: TodoItem[];
    };
  };
  [key: string]: unknown;
}

export interface Message {
  role: string;
  parts: Part[];
  tokens?: TokenInfo;
  cost?: number;
}

export interface SessionStats {
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
  totalCost: number;
  currentContextTokens: number;
}

export interface ContextUsageData {
  percentage: number;
  isHigh: boolean;
  isCritical: boolean;
  currentTokens: number;
}

export interface SidebarActionsProps {
  commands: Command[];
  onCommand: (command: Command) => void;
  isCommandDisabled: (command: Command) => boolean;
}

export interface SessionInfoProps {
  stats: SessionStats;
}

export interface ContextUsageProps {
  contextUsage: ContextUsageData;
  contextLimit: number;
}

export interface ChangedFilesProps {
  files: ChangedFile[];
}

export interface TasksProps {
  todos: TodoItem[];
}

/**
 * Format a number with K/M suffixes for display
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Format a cost value for display
 */
export function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}
