import { Lightbulb, Hammer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSettings } from "@/hooks";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  className?: string;
  disabled?: boolean;
}

export function ModeToggle({ className, disabled }: ModeToggleProps) {
  const { settings, setAgentMode } = useSettings();

  const toggleMode = () => {
    setAgentMode(settings.agentMode === "plan" ? "build" : "plan");
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleMode}
      disabled={disabled}
      className={cn("gap-2", className)}
      title={`Current mode: ${settings.agentMode}. Click to switch.`}
    >
      {settings.agentMode === "plan" ? (
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
