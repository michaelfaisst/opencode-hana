import { type ReactNode } from "react";
import { Image as ImageIcon, Lightbulb, Hammer, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
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
    onModelChange
}: InputControlsRowProps) {
    return (
        <div className="mt-3 space-y-2">
            {/* Row 1: Mode toggle + Model selector + Desktop hints */}
            <div className="flex items-center gap-2 overflow-hidden">
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
                                        "gap-1.5 text-xs w-20 shrink-0",
                                        agentMode === "plan"
                                            ? "border-amber-500/50"
                                            : "border-blue-500/50"
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
                        className="flex-1 xl:flex-none"
                    />
                )}

                {/* Spacer - only on desktop */}
                <div className="hidden xl:block flex-1" />

                {/* Desktop: Inline hints */}
                <InlineHints
                    className="hidden xl:flex"
                    voiceInputAvailable={voiceInputAvailable}
                />
            </div>

            {/* Row 2: Mobile/Tablet - Horizontally scrollable hints */}
            <HintsScrollRow
                className="xl:hidden"
                voiceInputAvailable={voiceInputAvailable}
            />
        </div>
    );
}

interface InlineHintsProps {
    className?: string;
    voiceInputAvailable?: boolean;
}

function InlineHints({ className, voiceInputAvailable }: InlineHintsProps) {
    return (
        <div
            className={cn(
                "items-center gap-3 text-xs text-muted-foreground whitespace-nowrap flex-shrink-0",
                className
            )}
        >
            <HintItem shortcut="/" label="commands" />
            <HintItem shortcut="@" label="files" />
            <HintItem shortcut="Tab" label="mode" />
            <HintItem shortcut="↑↓" label="history" />
            <HintItem shortcut="Esc" label="cancel" />
            <HintItem icon={<ImageIcon className="h-3 w-3" />} label="paste" />
            {voiceInputAvailable && (
                <HintItem
                    icon={<Mic className="h-3 w-3" />}
                    shortcut="Alt+Shift"
                    label="voice"
                />
            )}
        </div>
    );
}

interface HintsScrollRowProps {
    className?: string;
    voiceInputAvailable?: boolean;
}

function HintsScrollRow({
    className,
    voiceInputAvailable
}: HintsScrollRowProps) {
    return (
        <div className={cn("relative", className)}>
            {/* Scrollable hints container */}
            <div className="overflow-x-auto scrollbar-hide">
                <div className="flex items-center gap-3 text-xs text-muted-foreground whitespace-nowrap pb-1 pr-6">
                    <HintItem shortcut="/" label="commands" />
                    <HintItem shortcut="@" label="files" />
                    <HintItem shortcut="Tab" label="mode" />
                    <HintItem shortcut="↑↓" label="history" />
                    <HintItem shortcut="Esc" label="cancel" />
                    <HintItem
                        icon={<ImageIcon className="h-3 w-3" />}
                        label="paste"
                    />
                    {voiceInputAvailable && (
                        <HintItem
                            icon={<Mic className="h-3 w-3" />}
                            shortcut="Alt+Shift"
                            label="voice"
                        />
                    )}
                </div>
            </div>

            {/* Right fade gradient */}
            <div className="absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-background to-transparent pointer-events-none" />
        </div>
    );
}

interface HintItemProps {
    shortcut?: string;
    icon?: ReactNode;
    label: string;
}

function HintItem({ shortcut, icon, label }: HintItemProps) {
    return (
        <span className="flex items-center gap-1.5 shrink-0">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {shortcut && (
                <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">
                    {shortcut}
                </kbd>
            )}
            <span>{label}</span>
        </span>
    );
}
