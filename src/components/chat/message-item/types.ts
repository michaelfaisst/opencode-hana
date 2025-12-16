export interface TextPart {
  type: "text";
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
}

export interface ToolState {
  status: "pending" | "running" | "completed" | "error";
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

export interface ToolPart {
  type: "tool";
  tool: string;
  callID: string;
  state: ToolState;
  metadata?: Record<string, unknown>;
}

export interface FilePart {
  type: "file";
  filename?: string;
  url: string;
  mime: string;
}

export interface StepStartPart {
  type: "step-start";
}

export interface StepFinishPart {
  type: "step-finish";
  reason: string;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface ReasoningPart {
  type: "reasoning";
  text: string;
}

export type Part =
  | TextPart
  | ToolPart
  | FilePart
  | StepStartPart
  | StepFinishPart
  | ReasoningPart
  | { type: string; [key: string]: unknown };

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
}

export interface EditInput {
  filePath?: string;
  oldString?: string;
  newString?: string;
}

export interface TodoInput {
  todos?: TodoItem[];
}

export interface ReadInput {
  filePath?: string;
  offset?: number;
  limit?: number;
}

export interface WriteInput {
  filePath?: string;
  content?: string;
}

export interface BashInput {
  command?: string;
  description?: string;
  timeout?: number;
  workdir?: string;
}
