import { Image as ImageIcon, Lightbulb, Hammer, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ModelSelector, type SelectedModel } from "@/components/common";
import { cn } from "@/lib/utils";
import type { AgentMode } from "@/stores";

interface InputControlsRowProps {
  agentMode: AgentMode;
  isBusy: boolean;
  selectedModel?: SelectedModel;
  onToggleMode?: () => void;
  onModelChange?: (model: SelectedModel) => void;
}

export function InputControlsRow({
  agentMode,
  isBusy,
  selectedModel,
  onToggleMode,
  onModelChange,
}: InputControlsRowProps) {
  return (
    <div className="mt-3 flex items-center gap-2 overflow-hidden">
      {/* Mode toggle button */}
      {onToggleMode && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                onClick={onToggleMode}
                disabled={isBusy}
                className={cn(
                  "gap-1.5 text-xs w-20",
                  agentMode === "plan" ? "border-amber-500/50" : "border-blue-500/50"
                )}
              >
                {agentMode === "plan" ? (
                  <>
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                    <span>Plan</span>
                  </>
                ) : (
                  <>
                    <Hammer className="h-3.5 w-3.5 text-blue-500" />
                    <span>Build</span>
                  </>
                )}
              </Button>
            }
          />
          <TooltipContent>
            Current mode: {agentMode}. Press Tab to switch.
          </TooltipContent>
        </Tooltip>
      )}

      {/* Model selector */}
      {selectedModel && onModelChange && (
        <ModelSelector
          value={selectedModel}
          onChange={onModelChange}
          disabled={isBusy}
          className="flex-1 sm:flex-none"
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Desktop: Inline hints */}
      <InputHints className="hidden xl:flex" />

      {/* Mobile/Tablet: Help icon with popover */}
      <InputHintsPopover className="xl:hidden" />
    </div>
  );
}

interface InputHintsProps {
  className?: string;
}

function InputHints({ className }: InputHintsProps) {
  return (
    <div className={cn("items-center gap-2 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0", className)}>
      <span>/ commands</span>
      <span className="text-muted-foreground/50">·</span>
      <span>@ files</span>
      <span className="text-muted-foreground/50">·</span>
      <span>Tab mode</span>
      <span className="text-muted-foreground/50">·</span>
      <span>↑↓ history</span>
      <span className="text-muted-foreground/50">·</span>
      <span>Esc cancel</span>
      <span className="text-muted-foreground/50">·</span>
      <span className="flex items-center gap-1">
        <ImageIcon className="h-3 w-3" />
        paste
      </span>
    </div>
  );
}

interface InputHintsPopoverProps {
  className?: string;
}

function InputHintsPopover({ className }: InputHintsPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("h-7 w-7 text-muted-foreground hover:text-foreground", className)}
          >
            <HelpCircle className="h-4 w-4" />
            <span className="sr-only">Keyboard shortcuts</span>
          </Button>
        }
      />
      <PopoverContent 
        side="top" 
        align="end" 
        className="w-auto"
      >
        <div className="space-y-2 text-xs">
          <div className="font-medium text-foreground mb-2">Keyboard shortcuts</div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd>
            <span>Commands</span>
            
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">@</kbd>
            <span>Mention files</span>
            
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Tab</kbd>
            <span>Toggle Plan/Build mode</span>
            
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑ ↓</kbd>
            <span>Message history</span>
            
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Esc</kbd>
            <span>Cancel</span>
            
            <span className="flex items-center gap-1">
              <ImageIcon className="h-3 w-3" />
            </span>
            <span>Paste images from clipboard</span>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
