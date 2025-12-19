import { useState, memo, useMemo } from "react";
import {
    Terminal,
    ChevronDown,
    ChevronRight,
    Check,
    X,
    Loader2,
    Pencil,
    ListTodo,
    ArrowLeft,
    ArrowRight,
    Bot
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DiffViewer } from "../diff-viewer";
import { InlineTodoList } from "../todo-list";
import { FileContentViewer } from "./file-content-viewer";
import type {
    ToolPart,
    EditInput,
    TodoInput,
    ReadInput,
    WriteInput,
    BashInput,
    TaskInput
} from "./types";

interface ToolInvocationDisplayProps {
    part: ToolPart;
}

export const ToolInvocationDisplay = memo(function ToolInvocationDisplay({
    part
}: ToolInvocationDisplayProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { tool, state } = part;

    // Check if this is an edit tool with valid diff data
    const isEditTool = tool === "edit";
    const editInput = state.input as EditInput | undefined;
    const hasValidDiff =
        isEditTool && editInput?.oldString && editInput?.newString;

    // Check if this is a todowrite tool
    const isTodoWriteTool = tool === "todowrite";
    const todoInput = state.input as TodoInput | undefined;
    const hasTodos =
        isTodoWriteTool && todoInput?.todos && todoInput.todos.length > 0;

    // Check if this is a read tool
    const isReadTool = tool === "read";
    const readInput = state.input as ReadInput | undefined;

    // Check if this is a write tool
    const isWriteTool = tool === "write";
    const writeInput = state.input as WriteInput | undefined;

    // Check if this is a bash tool
    const isBashTool = tool === "bash";
    const bashInput = state.input as BashInput | undefined;

    // Check if this is a task tool (subagent)
    const isTaskTool = tool === "task";
    const taskInput = state.input as TaskInput | undefined;

    const statusIcon = useMemo(() => {
        const icons = {
            pending: (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ),
            running: <Loader2 className="h-3 w-3 animate-spin text-primary" />,
            completed: <Check className="h-3 w-3 text-green-500" />,
            error: <X className="h-3 w-3 text-destructive" />
        };
        return icons[state.status as keyof typeof icons] || null;
    }, [state.status]);

    // Render todowrite tool with inline todo list
    if (hasTodos) {
        return (
            <TodoToolDisplay
                todoInput={todoInput!}
                statusIcon={statusIcon}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
        );
    }

    // Render edit tool with diff viewer
    if (hasValidDiff) {
        return (
            <EditToolDisplay
                editInput={editInput!}
                state={state}
                statusIcon={statusIcon}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
        );
    }

    // Render read tool with file path
    if (isReadTool && readInput?.filePath) {
        return (
            <FileToolDisplay
                type="read"
                filePath={readInput.filePath}
                content={state.output as string | undefined}
                state={state}
                statusIcon={statusIcon}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
        );
    }

    // Render write tool with file path
    if (isWriteTool && writeInput?.filePath) {
        return (
            <FileToolDisplay
                type="write"
                filePath={writeInput.filePath}
                content={writeInput.content}
                state={state}
                statusIcon={statusIcon}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
        );
    }

    // Render bash tool with command
    if (isBashTool && bashInput?.command) {
        return (
            <BashToolDisplay
                bashInput={bashInput}
                state={state}
                statusIcon={statusIcon}
            />
        );
    }

    // Render task tool (subagent)
    if (isTaskTool && taskInput) {
        return (
            <TaskToolDisplay
                taskInput={taskInput}
                state={state}
                statusIcon={statusIcon}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
        );
    }

    // Default tool display
    return (
        <DefaultToolDisplay tool={tool} state={state} statusIcon={statusIcon} />
    );
});

interface TodoToolDisplayProps {
    todoInput: TodoInput;
    statusIcon: React.ReactNode;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const TodoToolDisplay = memo(function TodoToolDisplay({
    todoInput,
    statusIcon,
    isOpen,
    setIsOpen
}: TodoToolDisplayProps) {
    const completedCount =
        todoInput.todos?.filter((t) => t.status === "completed").length ?? 0;

    return (
        <details
            className="rounded border border-border bg-muted/50"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                <ListTodo className="h-3 w-3" />
                <span className="font-mono">
                    Tasks ({completedCount}/{todoInput.todos?.length ?? 0})
                </span>
                <span className="ml-auto">{statusIcon}</span>
            </summary>
            {/* Only render content when open for performance */}
            {isOpen && (
                <div className="border-t border-border p-2">
                    <InlineTodoList todos={todoInput.todos!} />
                </div>
            )}
        </details>
    );
});

interface EditToolDisplayProps {
    editInput: EditInput;
    state: ToolPart["state"];
    statusIcon: React.ReactNode;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const EditToolDisplay = memo(function EditToolDisplay({
    editInput,
    state,
    statusIcon,
    isOpen,
    setIsOpen
}: EditToolDisplayProps) {
    return (
        <details
            className="rounded border border-border bg-muted/50"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                <Pencil className="h-3 w-3" />
                <span className="font-mono">edit</span>
                <span className="font-mono text-foreground/70 truncate flex-1">
                    {editInput.filePath}
                </span>
                <span className="ml-auto">{statusIcon}</span>
            </summary>
            {/* Only render expensive DiffViewer when open */}
            {isOpen && (
                <div className="border-t border-border">
                    <DiffViewer
                        oldString={editInput.oldString!}
                        newString={editInput.newString!}
                        filePath={editInput.filePath}
                    />
                    {/* Error output */}
                    {state.status === "error" && state.error && (
                        <div className="mt-2 px-3 py-2 bg-destructive/10 rounded">
                            <div className="text-xs font-medium text-destructive mb-1">
                                Error
                            </div>
                            <pre className="text-xs font-mono text-destructive whitespace-pre-wrap">
                                {state.error}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </details>
    );
});

interface FileToolDisplayProps {
    type: "read" | "write";
    filePath: string;
    content?: string;
    state: ToolPart["state"];
    statusIcon: React.ReactNode;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const FileToolDisplay = memo(function FileToolDisplay({
    type,
    filePath,
    content,
    state,
    statusIcon,
    isOpen,
    setIsOpen
}: FileToolDisplayProps) {
    const Icon = type === "read" ? ArrowLeft : ArrowRight;
    const label = type === "read" ? "read" : "write";

    // For read tool, content comes from output; for write tool, it comes from input
    const displayContent = content || "";
    const hasContent = displayContent.length > 0;
    const hasError = state.status === "error" && state.error;

    return (
        <details
            className="rounded border border-border bg-muted/50"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                <Icon className="h-3 w-3" />
                <span className="font-mono">{label}</span>
                <span className="font-mono text-foreground/70 truncate flex-1">
                    {filePath}
                </span>
                <span className="ml-auto">{statusIcon}</span>
            </summary>
            {/* Only render expensive FileContentViewer when open */}
            {isOpen && (
                <div className="border-t border-border">
                    {/* File content with syntax highlighting */}
                    {hasContent && (
                        <FileContentViewer
                            content={displayContent}
                            filePath={filePath}
                            maxHeight="400px"
                            forceHighlight={type === "write"}
                        />
                    )}

                    {/* Error output */}
                    {hasError && (
                        <div className="px-3 py-2">
                            <div className="text-xs font-medium text-destructive mb-1">
                                Error
                            </div>
                            <pre
                                className={cn(
                                    "overflow-x-auto text-xs font-mono p-2 rounded max-h-64 overflow-y-auto",
                                    "bg-destructive/10 text-destructive"
                                )}
                            >
                                {state.error}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </details>
    );
});

interface BashToolDisplayProps {
    bashInput: BashInput;
    state: ToolPart["state"];
    statusIcon: React.ReactNode;
}

const BashToolDisplay = memo(function BashToolDisplay({
    bashInput,
    state,
    statusIcon
}: BashToolDisplayProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Format output for display
    const outputContent = useMemo(() => {
        if (state.status === "completed") {
            const output = state.output;
            if (output === null || output === undefined) return "";
            if (typeof output === "string") return output;
            return JSON.stringify(output, null, 2);
        }
        if (state.status === "error" && state.error) {
            return state.error;
        }
        return "";
    }, [state.status, state.output, state.error]);

    const hasContent = outputContent.length > 0;

    // Non-expandable version when there's no content
    if (!hasContent) {
        return (
            <div className="rounded border border-border bg-muted/50">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2 min-w-0">
                    <Terminal className="h-3 w-3 shrink-0" />
                    <span className="font-mono text-foreground/70 truncate">
                        {bashInput.command}
                    </span>
                    <span className="ml-auto shrink-0">{statusIcon}</span>
                </div>
            </div>
        );
    }

    return (
        <details
            className="rounded border border-border bg-muted/50"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2 min-w-0">
                {isOpen ? (
                    <ChevronDown className="h-3 w-3 shrink-0" />
                ) : (
                    <ChevronRight className="h-3 w-3 shrink-0" />
                )}
                <Terminal className="h-3 w-3 shrink-0" />
                <span className="font-mono text-foreground/70 truncate">
                    {bashInput.command}
                </span>
                <span className="ml-auto shrink-0">{statusIcon}</span>
            </summary>
            {isOpen && (
                <div className="border-t border-border">
                    <div className="px-3 py-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">
                            {state.status === "error" ? "Error" : "Output"}
                        </div>
                        <pre
                            className={cn(
                                "overflow-x-auto text-xs font-mono p-2 rounded max-h-64 overflow-y-auto whitespace-pre-wrap",
                                state.status === "error"
                                    ? "bg-destructive/10 text-destructive"
                                    : "bg-background"
                            )}
                        >
                            {outputContent}
                        </pre>
                    </div>
                </div>
            )}
        </details>
    );
});

interface TaskToolDisplayProps {
    taskInput: TaskInput;
    state: ToolPart["state"];
    statusIcon: React.ReactNode;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

const TaskToolDisplay = memo(function TaskToolDisplay({
    taskInput,
    state,
    statusIcon,
    isOpen,
    setIsOpen
}: TaskToolDisplayProps) {
    // Format output for display
    const outputContent = useMemo(() => {
        if (state.status === "completed" && state.output) {
            const output = state.output;
            if (output === null || output === undefined) return "";
            if (typeof output === "string") return output;
            return JSON.stringify(output, null, 2);
        }
        if (state.status === "error" && state.error) {
            return state.error;
        }
        return null;
    }, [state.status, state.output, state.error]);

    // Get display info
    const agentType = taskInput.subagent_type || "general";
    const description = taskInput.description || "Running subagent...";

    // Determine status text
    const statusText = useMemo(() => {
        switch (state.status) {
            case "pending":
                return "Waiting...";
            case "running":
                return "Working...";
            case "completed":
                return "Done";
            case "error":
                return "Failed";
            default:
                return "";
        }
    }, [state.status]);

    return (
        <details
            className="rounded border border-primary/30 bg-primary/5"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                <Bot className="h-3 w-3 text-primary" />
                <span className="font-mono text-primary">{agentType}</span>
                <span className="text-foreground/70 truncate flex-1">
                    {description}
                </span>
                <span className="text-xs text-muted-foreground">
                    {statusText}
                </span>
                <span className="ml-1">{statusIcon}</span>
            </summary>
            {/* Only render content when open */}
            {isOpen && (
                <div className="border-t border-primary/20">
                    {/* Prompt */}
                    {taskInput.prompt && (
                        <div className="px-3 py-2 border-b border-primary/20">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                Task
                            </div>
                            <pre className="overflow-x-auto text-xs font-mono bg-background p-2 rounded whitespace-pre-wrap max-h-32 overflow-y-auto">
                                {taskInput.prompt}
                            </pre>
                        </div>
                    )}

                    {/* Output/Result */}
                    {outputContent && (
                        <div className="px-3 py-2">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                {state.status === "error" ? "Error" : "Result"}
                            </div>
                            <pre
                                className={cn(
                                    "overflow-x-auto text-xs font-mono p-2 rounded max-h-64 overflow-y-auto whitespace-pre-wrap",
                                    state.status === "error"
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-background"
                                )}
                            >
                                {outputContent}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </details>
    );
});

interface DefaultToolDisplayProps {
    tool: string;
    state: ToolPart["state"];
    statusIcon: React.ReactNode;
}

const DefaultToolDisplay = memo(function DefaultToolDisplay({
    tool,
    state,
    statusIcon
}: DefaultToolDisplayProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Format output for display
    const outputContent = useMemo(() => {
        if (state.status === "completed") {
            const output = state.output;
            if (output === null || output === undefined) return "";
            if (typeof output === "string") return output;
            return JSON.stringify(output, null, 2);
        }
        if (state.status === "error" && state.error) {
            return state.error;
        }
        return "";
    }, [state.status, state.output, state.error]);

    const hasOutput = outputContent.length > 0;
    const hasInput = state.input && Object.keys(state.input).length > 0;
    const hasContent = hasOutput || hasInput;

    // Non-expandable version when there's no content
    if (!hasContent) {
        return (
            <div className="rounded border border-border bg-muted/50">
                <div className="px-3 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <Terminal className="h-3 w-3" />
                    <span className="font-mono">{tool}</span>
                    <span className="ml-auto">{statusIcon}</span>
                </div>
            </div>
        );
    }

    return (
        <details
            className="rounded border border-border bg-muted/50"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-2">
                {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                <Terminal className="h-3 w-3" />
                <span className="font-mono">{tool}</span>
                <span className="ml-auto">{statusIcon}</span>
            </summary>
            {isOpen && (
                <div className="border-t border-border">
                    {/* Input */}
                    {hasInput && (
                        <div
                            className={cn(
                                "px-3 py-2",
                                hasOutput && "border-b border-border"
                            )}
                        >
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                Input
                            </div>
                            <pre className="overflow-x-auto text-xs font-mono bg-background p-2 rounded max-h-64 overflow-y-auto whitespace-pre-wrap">
                                {JSON.stringify(state.input, null, 2)}
                            </pre>
                        </div>
                    )}

                    {/* Output */}
                    {hasOutput && (
                        <div className="px-3 py-2">
                            <div className="text-xs font-medium text-muted-foreground mb-1">
                                {state.status === "error" ? "Error" : "Output"}
                            </div>
                            <pre
                                className={cn(
                                    "overflow-x-auto text-xs font-mono p-2 rounded max-h-64 overflow-y-auto whitespace-pre-wrap",
                                    state.status === "error"
                                        ? "bg-destructive/10 text-destructive"
                                        : "bg-background"
                                )}
                            >
                                {outputContent}
                            </pre>
                        </div>
                    )}
                </div>
            )}
        </details>
    );
});
