import { useMemo } from "react";
import { CheckCircle2, Circle, Loader2, XCircle, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
}

interface ToolPart {
  type: "tool";
  tool: string;
  state: {
    status: string;
    input?: {
      todos?: TodoItem[];
    };
  };
}

interface Part {
  type: string;
  [key: string]: unknown;
}

interface Message {
  role: string;
  parts: Part[];
}

interface TodoListProps {
  messages: Message[];
  className?: string;
}

export function TodoList({ messages, className }: TodoListProps) {
  // Extract todos from the most recent assistant message that has todowrite calls
  const todos = useMemo(() => {
    let latestTodos: TodoItem[] = [];

    // Iterate backwards to find the most recent assistant message with todos
    for (let i = messages.length - 1; i >= 0; i--) {
      const message = messages[i];
      if (message.role !== "assistant") continue;

      for (const part of message.parts) {
        if (part.type === "tool") {
          const toolPart = part as unknown as ToolPart;
          if (toolPart.tool === "todowrite" && toolPart.state?.input?.todos) {
            // Found todos - merge by ID within this message
            const todosById = new Map<string, TodoItem>();

            for (const p of message.parts) {
              if (p.type === "tool") {
                const tp = p as unknown as ToolPart;
                if (tp.tool === "todowrite" && tp.state?.input?.todos) {
                  for (const todo of tp.state.input.todos) {
                    todosById.set(todo.id, todo);
                  }
                }
              }
            }

            latestTodos = Array.from(todosById.values());
            break;
          }
        }
      }

      if (latestTodos.length > 0) break;
    }

    return latestTodos;
  }, [messages]);

  if (todos.length === 0) {
    return null;
  }

  const completedCount = todos.filter((t) => t.status === "completed").length;
  const progress = Math.round((completedCount / todos.length) * 100);

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {completedCount}/{todos.length}
          </span>
          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Todo items */}
      <div className="divide-y divide-border">
        {todos.map((todo) => (
          <TodoItemRow key={todo.id} todo={todo} />
        ))}
      </div>
    </div>
  );
}

function TodoItemRow({ todo }: { todo: TodoItem }) {
  const statusIcon = {
    pending: <Circle className="h-4 w-4 text-muted-foreground" />,
    in_progress: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
    completed: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    cancelled: <XCircle className="h-4 w-4 text-muted-foreground" />,
  }[todo.status];

  const priorityBadge = {
    high: (
      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-red-500/10 text-red-500">
        HIGH
      </span>
    ),
    medium: (
      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-yellow-500/10 text-yellow-500">
        MED
      </span>
    ),
    low: (
      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-500/10 text-blue-500">
        LOW
      </span>
    ),
  }[todo.priority];

  return (
    <div
      className={cn(
        "flex items-start gap-2 px-3 py-2",
        todo.status === "completed" && "opacity-60",
        todo.status === "cancelled" && "opacity-40"
      )}
    >
      <div className="mt-0.5 shrink-0">{statusIcon}</div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm",
            todo.status === "completed" && "line-through",
            todo.status === "cancelled" && "line-through"
          )}
        >
          {todo.content}
        </p>
      </div>
      <div className="shrink-0">{priorityBadge}</div>
    </div>
  );
}

// Compact inline version for showing in message stream (no wrapper - used inside ToolInvocationDisplay)
export function InlineTodoList({ todos }: { todos: TodoItem[] }) {
  if (todos.length === 0) return null;

  return (
    <div className="space-y-1">
      {todos.map((todo) => (
        <div key={todo.id} className="flex items-center gap-2 text-xs">
          {todo.status === "completed" ? (
            <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />
          ) : todo.status === "in_progress" ? (
            <Loader2 className="h-3 w-3 text-primary animate-spin shrink-0" />
          ) : todo.status === "cancelled" ? (
            <XCircle className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <Circle className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <span
            className={cn(
              "truncate",
              (todo.status === "completed" || todo.status === "cancelled") &&
                "line-through opacity-60"
            )}
          >
            {todo.content}
          </span>
        </div>
      ))}
    </div>
  );
}
