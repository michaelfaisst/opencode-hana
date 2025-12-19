import { Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetryStatus {
  type: "retry";
  attempt: number;
  message: string;
  next: number;
}

interface StreamingIndicatorProps {
  isBusy?: boolean;
  retryStatus?: RetryStatus;
  className?: string;
}

export function StreamingIndicator({ isBusy, retryStatus, className }: StreamingIndicatorProps) {
  if (retryStatus) {
    const nextRetryTime = new Date(retryStatus.next).toLocaleTimeString();
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200 dark:border-amber-800",
          className
        )}
      >
        <RefreshCw className="h-4 w-4 animate-spin" />
        <span>
          Retrying (attempt {retryStatus.attempt}): {retryStatus.message}
        </span>
        <span className="text-xs text-muted-foreground">Next attempt at {nextRetryTime}</span>
      </div>
    );
  }

  if (isBusy) {
    return (
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground bg-muted/50 border-t",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Assistant is thinking...</span>
        <div className="flex gap-1 ml-1">
          <span className="animate-bounce" style={{ animationDelay: "0ms" }}>
            .
          </span>
          <span className="animate-bounce" style={{ animationDelay: "150ms" }}>
            .
          </span>
          <span className="animate-bounce" style={{ animationDelay: "300ms" }}>
            .
          </span>
        </div>
      </div>
    );
  }

  return null;
}
