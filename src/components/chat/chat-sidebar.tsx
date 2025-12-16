import { useMemo } from "react";
import { MessageSquare, Cpu, ListTodo, CheckCircle2, Circle, Loader2, XCircle, Coins, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  priority: "high" | "medium" | "low";
}

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
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

function formatCost(cost: number): string {
  if (cost < 0.01) {
    return `$${cost.toFixed(4)}`;
  }
  return `$${cost.toFixed(2)}`;
}

export function ChatSidebar({ messages, contextLimit, className }: ChatSidebarProps) {
  // Extract the latest todos from todowrite tool calls
  const todos = useMemo(() => {
    let latestTodos: TodoItem[] = [];
    
    for (const message of messages) {
      if (message.role !== "assistant") continue;
      
      for (const part of message.parts) {
        if (part.type === "tool" && part.tool === "todowrite" && part.state?.input?.todos) {
          latestTodos = part.state.input.todos;
        }
      }
    }
    
    return latestTodos;
  }, [messages]);

  // Calculate message stats and token usage
  const stats = useMemo(() => {
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
          const contextTokens = message.tokens.input + (message.tokens.cache?.read || 0);
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
  const contextUsage = useMemo(() => {
    if (!contextLimit || stats.currentContextTokens === 0) return null;
    const percentage = (stats.currentContextTokens / contextLimit) * 100;
    return {
      percentage: Math.min(percentage, 100),
      isHigh: percentage > 80,
      isCritical: percentage > 95,
      currentTokens: stats.currentContextTokens,
    };
  }, [contextLimit, stats.currentContextTokens]);

  const completedCount = todos.filter(t => t.status === "completed").length;
  const inProgressCount = todos.filter(t => t.status === "in_progress").length;
  const progress = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className={cn("flex flex-col h-full bg-muted/30 border-l border-border", className)}>
      {/* Session Info */}
      <div className="p-4 border-b border-border">
        <h3 className="text-sm font-medium mb-3">Session Info</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{stats.userMessages + stats.assistantMessages} messages</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            <span>{stats.toolCalls} tool calls</span>
          </div>
          {stats.totalCost > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Coins className="h-3.5 w-3.5" />
              <span>{formatCost(stats.totalCost)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Context Usage */}
      {contextUsage && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5">
              <PieChart className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-medium">Context</span>
            </div>
            <span className={cn(
              "font-mono",
              contextUsage.isCritical && "text-destructive",
              contextUsage.isHigh && !contextUsage.isCritical && "text-yellow-500"
            )}>
              {contextUsage.percentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-300",
                contextUsage.isCritical ? "bg-destructive" : 
                contextUsage.isHigh ? "bg-yellow-500" : "bg-primary"
              )}
              style={{ width: `${contextUsage.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>{formatNumber(contextUsage.currentTokens)}</span>
            <span>{formatNumber(contextLimit!)}</span>
          </div>
        </div>
      )}

      {/* Todo List */}
      {todos.length > 0 && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ListTodo className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Tasks</h3>
              </div>
              <span className="text-xs text-muted-foreground">
                {completedCount}/{todos.length}
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            {inProgressCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {inProgressCount} task{inProgressCount > 1 ? 's' : ''} in progress
              </p>
            )}
          </div>
          
          {/* Todo items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1">
              {todos.map((todo) => (
                <TodoItemRow key={todo.id} todo={todo} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state when no todos */}
      {todos.length === 0 && (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <ListTodo className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              No active tasks
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function TodoItemRow({ todo }: { todo: TodoItem }) {
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
    <div className={cn(
      "flex items-start gap-2 px-2 py-1.5 rounded-sm border-l-2",
      priorityColor,
      todo.status === "completed" && "opacity-60",
      todo.status === "cancelled" && "opacity-40",
      todo.status === "in_progress" && "bg-primary/5"
    )}>
      <div className="mt-0.5 shrink-0">
        {statusIcon}
      </div>
      <p className={cn(
        "text-xs leading-relaxed",
        (todo.status === "completed" || todo.status === "cancelled") && "line-through"
      )}>
        {todo.content}
      </p>
    </div>
  );
}
