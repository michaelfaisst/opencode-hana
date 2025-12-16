import {
  ListTodo,
  Circle,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "./collapsible-section";
import type { TasksProps, TodoItem } from "./types";

export function SidebarTasks({ todos }: TasksProps) {
  const completedCount = todos.filter((t) => t.status === "completed").length;
  const inProgressCount = todos.filter((t) => t.status === "in_progress").length;
  const progress =
    todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  const badge = (
    <span className="text-xs text-muted-foreground">
      {completedCount}/{todos.length}
    </span>
  );

  return (
    <CollapsibleSection
      title="Tasks"
      icon={<ListTodo className="h-4 w-4" />}
      badge={badge}
      defaultOpen={true}
      storageKey="tasks"
      className="flex-1 overflow-hidden flex flex-col border-b-0"
    >
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Progress bar */}
        <div className="px-4 pb-2">
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {inProgressCount > 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              {inProgressCount} task{inProgressCount > 1 ? "s" : ""} in progress
            </p>
          )}
        </div>

        {/* Todo items */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 pb-2 space-y-1">
            {todos.map((todo) => (
              <TodoItemRow key={todo.id} todo={todo} />
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

interface TodoItemRowProps {
  todo: TodoItem;
}

function TodoItemRow({ todo }: TodoItemRowProps) {
  const statusIcon = {
    pending: <Circle className="h-3.5 w-3.5 text-muted-foreground" />,
    in_progress: <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />,
    completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
    cancelled: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
  }[todo.status];

  const priorityColor = {
    high: "border-l-red-500",
    medium: "border-l-yellow-500",
    low: "border-l-blue-500",
  }[todo.priority];

  return (
    <div
      className={cn(
        "flex items-start gap-2 px-2 py-1.5 rounded-sm border-l-2",
        priorityColor,
        todo.status === "completed" && "opacity-60",
        todo.status === "cancelled" && "opacity-40",
        todo.status === "in_progress" && "bg-primary/5"
      )}
    >
      <div className="mt-0.5 shrink-0">{statusIcon}</div>
      <p
        className={cn(
          "text-xs leading-relaxed",
          (todo.status === "completed" || todo.status === "cancelled") &&
            "line-through"
        )}
      >
        {todo.content}
      </p>
    </div>
  );
}
