import { MessageSquare, Cpu, Coins } from "lucide-react";
import { CollapsibleSection } from "./collapsible-section";
import { formatCost, type SessionInfoProps } from "./types";

export function SidebarSessionInfo({ stats }: SessionInfoProps) {
  return (
    <CollapsibleSection
      title="Session Info"
      icon={<MessageSquare className="h-4 w-4" />}
      defaultOpen={true}
      storageKey="session-info"
    >
      <div className="px-4 pb-4 space-y-2">
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
    </CollapsibleSection>
  );
}
