import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReasoningPart } from "./types";

interface ReasoningDisplayProps {
    parts: ReasoningPart[];
}

export function ReasoningDisplay({ parts }: ReasoningDisplayProps) {
    const [isOpen, setIsOpen] = useState(false);
    const content = parts.map((p) => p.text).join("\n");

    return (
        <details
            className="rounded border border-border bg-muted/30"
            open={isOpen}
            onToggle={(e) => setIsOpen(e.currentTarget.open)}
        >
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                {isOpen ? (
                    <ChevronDown className="h-3 w-3" />
                ) : (
                    <ChevronRight className="h-3 w-3" />
                )}
                Reasoning
            </summary>
            <div className="border-t border-border px-3 py-2">
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">
                    {content}
                </div>
            </div>
        </details>
    );
}
