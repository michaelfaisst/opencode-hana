import { SessionCard } from "./session-card";
import { Skeleton } from "@/components/common/loading-skeleton";
import type { Session } from "@opencode-ai/sdk/client";

// Extend SDK Session type with optional timestamp fields that the API returns
type SessionWithTimestamps = Session & {
  createdAt?: string;
  updatedAt?: string;
};

interface SessionListProps {
  sessions: Session[];
  isLoading?: boolean;
  onDeleteSession?: (id: string) => void;
}

export function SessionList({
  sessions,
  isLoading,
  onDeleteSession,
}: SessionListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-muted-foreground">No sessions yet</p>
        <p className="text-sm text-muted-foreground">
          Create a new session to get started
        </p>
      </div>
    );
  }

  // Cast sessions to include optional timestamp fields from API response
  const sessionsWithTimestamps = sessions as SessionWithTimestamps[];
  
  // Sort by most recent timestamp (createdAt or updatedAt, whichever is newer)
  const sortedSessions = [...sessionsWithTimestamps].sort((a, b) => {
    const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const aUpdated = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    const bUpdated = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    const aTime = Math.max(aCreated, aUpdated);
    const bTime = Math.max(bCreated, bUpdated);
    return bTime - aTime;
  });

  return (
    <div className="grid gap-3 p-4">
      {sortedSessions.map((session) => (
        <SessionCard
          key={session.id}
          id={session.id}
          title={session.title}
          directory={session.directory}
          updatedAt={session.updatedAt}
          onDelete={onDeleteSession}
        />
      ))}
    </div>
  );
}
