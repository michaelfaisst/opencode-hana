import { Lightbulb, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppSettingsStore } from "@/stores";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  className?: string;
  disabled?: boolean;
}

export function ModeToggle({ className, disabled }: ModeToggleProps) {
  const { agentMode, toggleAgentMode } = useAppSettingsStore();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleAgentMode}
      disabled={disabled}
      className={cn("gap-2", className)}
      title={`Current mode: ${agentMode}. Click to switch.`}
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
  );
}
