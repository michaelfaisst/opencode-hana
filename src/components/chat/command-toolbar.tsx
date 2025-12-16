import { memo } from "react";
import { Button } from "@/components/ui/button";
import { COMMANDS, type Command } from "@/hooks/use-commands";
import { cn } from "@/lib/utils";

interface CommandToolbarProps {
  onCommand: (command: Command) => void;
  disabled?: boolean;
  hasSession?: boolean;
  hasMessages?: boolean;
  className?: string;
}

/**
 * Toolbar with buttons for common commands
 */
export const CommandToolbar = memo(function CommandToolbar({
  onCommand,
  disabled,
  hasSession = false,
  hasMessages = false,
  className,
}: CommandToolbarProps) {
  // Filter to only show toolbar commands
  const toolbarCommands = COMMANDS.filter((cmd) => cmd.showInToolbar);

  // Check if a command should be disabled
  const isCommandDisabled = (command: Command): boolean => {
    if (disabled) return true;
    if (command.requiresSession && !hasSession) return true;
    if (command.requiresMessages && !hasMessages) return true;
    return false;
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {toolbarCommands.map((command) => {
        const Icon = command.icon;
        const isDisabled = isCommandDisabled(command);

        return (
          <Button
            key={command.name}
            variant="outline"
            size="sm"
            onClick={() => onCommand(command)}
            disabled={isDisabled}
            title={`${command.label}: ${command.description}${command.shortcut ? ` (${command.shortcut})` : ""}`}
            className="h-7 px-2 gap-1.5 text-xs"
          >
            <Icon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{command.label}</span>
          </Button>
        );
      })}
    </div>
  );
});
