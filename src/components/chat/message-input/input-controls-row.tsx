import { Image as ImageIcon, Lightbulb, Hammer, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ModelSelector, type SelectedModel } from "@/components/common";
import { cn } from "@/lib/utils";
import type { AgentMode } from "@/stores";

interface InputControlsRowProps {
  agentMode: AgentMode;
  isBusy: boolean;
  selectedModel?: SelectedModel;
  voiceInputAvailable?: boolean;
  onToggleMode?: () => void;
  onModelChange?: (model: SelectedModel) => void;
}

export function InputControlsRow({
  agentMode,
  isBusy,
  selectedModel,
  voiceInputAvailable,
  onToggleMode,
  onModelChange,
}: InputControlsRowProps) {
  return (
    <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
      <div className="flex items-center gap-2">
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
      </div>

      {/* Hints */}
      <InputHints isBusy={isBusy} voiceInputAvailable={voiceInputAvailable} />
    </div>
  );
}

interface InputHintsProps {
  isBusy: boolean;
  voiceInputAvailable?: boolean;
}

function InputHints({ isBusy, voiceInputAvailable }: InputHintsProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground sm:ml-auto flex-wrap">
      <span>/ commands</span>
      <span className="text-muted-foreground/50">·</span>
      <span>@ files</span>
      <span className="text-muted-foreground/50">·</span>
      <span>Tab mode</span>
      <span className="text-muted-foreground/50">·</span>
      <span>↑↓ history</span>
      {isBusy && (
        <>
          <span className="text-muted-foreground/50">·</span>
          <span>Esc cancel</span>
          <span className="text-muted-foreground/50">·</span>
          <span className="text-primary">queues</span>
        </>
      )}
      <span className="text-muted-foreground/50">·</span>
      <span className="flex items-center gap-1">
        <ImageIcon className="h-3 w-3" />
        paste
      </span>
      {voiceInputAvailable && (
        <>
          <span className="text-muted-foreground/50">·</span>
          <span className="flex items-center gap-1">
            <Mic className="h-3 w-3" />
            Alt+Shift
          </span>
        </>
      )}
    </div>
  );
}
