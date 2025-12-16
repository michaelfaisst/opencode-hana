import { User, Bot, FileCode, Terminal, ChevronDown, ChevronRight, Check, X, Loader2, Pencil, ListTodo } from "lucide-react";
import { MarkdownContent } from "@/components/common/markdown-content";
import { cn } from "@/lib/utils";
import { useState, memo } from "react";
import { DiffViewer } from "./diff-viewer";
import { InlineTodoList } from "./todo-list";
import { ImageLightbox } from "./image-lightbox";

interface TextPart {
  type: "text";
  text: string;
  synthetic?: boolean;
  ignored?: boolean;
}

interface ToolState {
  status: "pending" | "running" | "completed" | "error";
  input?: Record<string, unknown>;
  output?: unknown;
  error?: string;
}

interface ToolPart {
  type: "tool";
  tool: string;
  callID: string;
  state: ToolState;
  metadata?: Record<string, unknown>;
}

interface FilePart {
  type: "file";
  filename?: string;
  url: string;
  mime: string;
}

interface StepStartPart {
  type: "step-start";
}

interface StepFinishPart {
  type: "step-finish";
  reason: string;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
  };
}

interface ReasoningPart {
  type: "reasoning";
  text: string;
}

type Part = TextPart | ToolPart | FilePart | StepStartPart | StepFinishPart | ReasoningPart | { type: string; [key: string]: unknown };

interface MessageItemProps {
  role: "user" | "assistant";
  parts: Part[];
  isStreaming?: boolean;
}

export const MessageItem = memo(function MessageItem({ role, parts, isStreaming }: MessageItemProps) {
  const isUser = role === "user";

  // Combine text parts (excluding synthetic/ignored ones)
  const textContent = parts
    .filter((part): part is TextPart => 
      part.type === "text" && 
      !!(part as TextPart).text &&
      !(part as TextPart).synthetic &&
      !(part as TextPart).ignored
    )
    .map((part) => part.text)
    .join("\n");

  // Get tool invocations
  const toolParts = parts.filter((part): part is ToolPart => part.type === "tool");

  // Get file parts
  const fileParts = parts.filter((part): part is FilePart => part.type === "file");

  // Get reasoning parts
  const reasoningParts = parts.filter((part): part is ReasoningPart => part.type === "reasoning");

  // Don't render messages with no visible content (e.g., empty messages from /compact)
  const hasVisibleContent = textContent || toolParts.length > 0 || fileParts.length > 0 || reasoningParts.length > 0 || isStreaming;
  if (!hasVisibleContent) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser ? "bg-muted/50" : "bg-background"
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-secondary"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className="flex-1 space-y-2 overflow-hidden">
        <div className="text-xs font-medium text-muted-foreground">
          {isUser ? "You" : "Assistant"}
        </div>
        
        {/* Reasoning content (collapsible) */}
        {reasoningParts.length > 0 && (
          <ReasoningDisplay parts={reasoningParts} />
        )}
        
        {/* Main text content */}
        {textContent && (
          <div className="text-sm">
            <MarkdownContent content={textContent} />
          </div>
        )}
        
        {/* File attachments */}
        {fileParts.length > 0 && (
          <div className="space-y-1">
            {fileParts.map((part, index) => (
              <FileDisplay key={index} part={part} />
            ))}
          </div>
        )}
        
        {/* Tool invocations */}
        {toolParts.length > 0 && (
          <div className="space-y-2">
            {toolParts.map((part, index) => (
              <ToolInvocationDisplay key={part.callID || index} part={part} />
            ))}
          </div>
        )}
        
        {isStreaming && (
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-xs text-muted-foreground">Thinking...</span>
          </div>
        )}
      </div>
    </div>
  );
});

function ReasoningDisplay({ parts }: { parts: ReasoningPart[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const content = parts.map((p) => p.text).join("\n");
  
  return (
    <details 
      className="rounded border border-border bg-muted/30"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        Reasoning
      </summary>
      <div className="border-t border-border px-3 py-2">
        <div className="text-xs text-muted-foreground whitespace-pre-wrap">
          {content}
        </div>
      </div>
    </details>
  );
}

function FileDisplay({ part }: { part: FilePart }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = part.mime?.startsWith("image/");

  // For images, show a clickable thumbnail with lightbox
  if (isImage && part.url) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block max-w-xs cursor-pointer overflow-hidden rounded-md border border-border bg-muted/50 transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <img
            src={part.url}
            alt={part.filename || "Image"}
            className="max-h-48 w-auto object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
            <span className="sr-only">View full image</span>
          </div>
        </button>

        {/* Image Lightbox */}
        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          src={part.url}
          alt={part.filename || "Image"}
        />
      </>
    );
  }

  // For non-image files, show file info
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <FileCode className="h-3 w-3" />
      <span className="font-mono">{part.filename || "File"}</span>
      {part.mime && <span className="text-muted-foreground/60">({part.mime})</span>}
    </div>
  );
}

function ToolInvocationDisplay({ part }: { part: ToolPart }) {
  const [isOpen, setIsOpen] = useState(false);
  const { tool, state } = part;
  
  // Check if this is an edit tool with valid diff data
  const isEditTool = tool === "edit";
  const editInput = state.input as { filePath?: string; oldString?: string; newString?: string } | undefined;
  const hasValidDiff = isEditTool && editInput?.oldString && editInput?.newString;
  
  // Check if this is a todowrite tool
  const isTodoWriteTool = tool === "todowrite";
  const todoInput = state.input as { todos?: Array<{ id: string; content: string; status: "pending" | "in_progress" | "completed" | "cancelled"; priority: "high" | "medium" | "low" }> } | undefined;
  const hasTodos = isTodoWriteTool && todoInput?.todos && todoInput.todos.length > 0;
  
  const statusIcon = {
    pending: <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />,
    running: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
    completed: <Check className="h-3 w-3 text-green-500" />,
    error: <X className="h-3 w-3 text-destructive" />,
  }[state.status] || null;

  // Format output for display
  const formatOutput = (output: unknown): string => {
    if (output === null || output === undefined) return "";
    if (typeof output === "string") return output;
    return JSON.stringify(output, null, 2);
  };

  const outputContent = state.status === "completed" && state.output 
    ? formatOutput(state.output)
    : state.status === "error" && state.error
    ? state.error
    : null;

  // Render todowrite tool with inline todo list
  if (hasTodos) {
    const completedCount = todoInput.todos!.filter(t => t.status === "completed").length;
    return (
      <details 
        className="rounded border border-border bg-muted/50"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <ListTodo className="h-3 w-3" />
          <span className="font-mono">Tasks ({completedCount}/{todoInput.todos!.length})</span>
          <span className="ml-auto">{statusIcon}</span>
        </summary>
        <div className="border-t border-border p-2">
          <InlineTodoList todos={todoInput.todos!} />
        </div>
      </details>
    );
  }

  // Render edit tool with diff viewer
  if (hasValidDiff) {
    return (
      <details 
        className="rounded border border-border bg-muted/50"
        open={isOpen}
        onToggle={(e) => setIsOpen(e.currentTarget.open)}
      >
        <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
          {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          <Pencil className="h-3 w-3" />
          <span className="font-mono truncate flex-1">{editInput.filePath || "edit"}</span>
          <span className="ml-auto">{statusIcon}</span>
        </summary>
        <div className="border-t border-border">
          <DiffViewer 
            oldString={editInput.oldString!}
            newString={editInput.newString!}
            filePath={editInput.filePath}
          />
          {/* Error output */}
          {state.status === "error" && state.error && (
            <div className="mt-2 px-3 py-2 bg-destructive/10 rounded">
              <div className="text-xs font-medium text-destructive mb-1">Error</div>
              <pre className="text-xs font-mono text-destructive whitespace-pre-wrap">
                {state.error}
              </pre>
            </div>
          )}
        </div>
      </details>
    );
  }

  // Default tool display
  return (
    <details 
      className="rounded border border-border bg-muted/50"
      open={isOpen}
      onToggle={(e) => setIsOpen(e.currentTarget.open)}
    >
      <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
        {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        <Terminal className="h-3 w-3" />
        <span className="font-mono">{tool}</span>
        <span className="ml-auto">{statusIcon}</span>
      </summary>
      <div className="border-t border-border">
        {/* Input */}
        {state.input && Object.keys(state.input).length > 0 && (
          <div className="px-3 py-2 border-b border-border">
            <div className="text-xs font-medium text-muted-foreground mb-1">Input</div>
            <pre className="overflow-x-auto text-xs font-mono bg-background p-2 rounded">
              {JSON.stringify(state.input, null, 2)}
            </pre>
          </div>
        )}
        
        {/* Output */}
        {outputContent && (
          <div className="px-3 py-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              {state.status === "error" ? "Error" : "Output"}
            </div>
            <pre className={cn(
              "overflow-x-auto text-xs font-mono p-2 rounded max-h-64 overflow-y-auto",
              state.status === "error" ? "bg-destructive/10 text-destructive" : "bg-background"
            )}>
              {outputContent}
            </pre>
          </div>
        )}
      </div>
    </details>
  );
}
