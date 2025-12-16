import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "./collapsible-section";
import type { SidebarActionsProps } from "./types";

export function SidebarActions({
  commands,
  onCommand,
  isCommandDisabled,
}: SidebarActionsProps) {
  return (
    <CollapsibleSection
      title="Actions"
      icon={<Zap className="h-4 w-4" />}
      defaultOpen={true}
      storageKey="actions"
    >
      <div className="px-4 pb-4 flex flex-wrap gap-1.5">
        {commands.map((command) => {
          const Icon = command.icon;
          const isDisabled = isCommandDisabled(command);

          return (
            <Button
              key={command.name}
              variant="outline"
              size="sm"
              onClick={() => onCommand(command)}
              disabled={isDisabled}
              title={`${command.description}${command.shortcut ? ` (${command.shortcut})` : ""}`}
              className="h-7 px-2 gap-1.5 text-xs"
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{command.label}</span>
            </Button>
          );
        })}
      </div>
    </CollapsibleSection>
  );
}
