import { Lightbulb, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { useAppSettingsStore } from "@/stores";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  className?: string;
  disabled?: boolean;
}

export function ModeToggle({ className, disabled }: ModeToggleProps) {
  const { agentMode, toggleAgentMode } = useAppSettingsStore();

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAgentMode}
            disabled={disabled}
            className={cn("gap-2", className)}
          >
            {agentMode === "plan" ? (
              <>
                <Lightbulb className="h-4 w-4" />
                <span className="hidden sm:inline">Plan</span>
              </>
            ) : (
              <>
                <Hammer className="h-4 w-4" />
                <span className="hidden sm:inline">Build</span>
              </>
            )}
          </Button>
        }
      />
      <TooltipContent>
        Current mode: {agentMode}. Click to switch.
      </TooltipContent>
    </Tooltip>
  );
}
