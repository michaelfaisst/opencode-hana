import { Link } from "react-router-dom";
import { MessageSquare, Trash2, Folder } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SessionCardProps {
  id: string;
  title?: string;
  directory?: string;
  updatedAt?: string;
  onDelete?: (id: string) => void;
}

/**
 * Get a display name from a directory path
 * e.g., "/Users/michaelfaisst/Work/Private/opencode-web" -> "opencode-web"
 */
function getProjectName(directory: string): string {
  if (directory === "/") return "global";
  const parts = directory.split("/").filter(Boolean);
  return parts[parts.length - 1] || directory;
}

export function SessionCard({
  id,
  title,
  directory,
  updatedAt,
  onDelete,
}: SessionCardProps) {
  const displayTitle = title || `Session ${id.slice(0, 8)}`;
  const projectName = directory ? getProjectName(directory) : null;
  const updatedDate = updatedAt ? new Date(updatedAt) : null;
  const timeAgo = updatedDate ? getTimeAgo(updatedDate) : null;

  return (
    <Card className="group relative transition-colors hover:bg-muted">
      <Link to={`/sessions/${id}`} className="block">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
              <CardTitle className="text-sm font-medium truncate">
                {displayTitle}
              </CardTitle>
            </div>
          </div>
          <CardDescription className="text-xs space-y-0.5">
            {projectName && (
              <span className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {projectName}
              </span>
            )}
            <span>{timeAgo ? `Updated ${timeAgo}` : "No activity yet"}</span>
          </CardDescription>
        </CardHeader>
      </Link>
      {onDelete && (
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "absolute right-2 top-2 h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100",
            "text-muted-foreground hover:text-destructive"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete session</span>
        </Button>
      )}
    </Card>
  );
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}
