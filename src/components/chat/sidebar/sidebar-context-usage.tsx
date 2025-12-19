import { PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "./collapsible-section";
import { formatNumber, type ContextUsageData } from "./types";

interface SidebarContextUsageProps {
    contextUsage: ContextUsageData | null;
    contextLimit: number | undefined;
}

export function SidebarContextUsage({
    contextUsage,
    contextLimit
}: SidebarContextUsageProps) {
    const badge = contextUsage ? (
        <span
            className={cn(
                "text-xs font-mono",
                contextUsage.isCritical && "text-destructive",
                contextUsage.isHigh &&
                    !contextUsage.isCritical &&
                    "text-yellow-500"
            )}
        >
            {contextUsage.percentage.toFixed(1)}%
        </span>
    ) : null;

    return (
        <CollapsibleSection
            title="Context"
            icon={<PieChart className="h-4 w-4" />}
            badge={badge}
            defaultOpen={true}
            storageKey="context-usage"
        >
            {contextUsage && contextLimit ? (
                <div className="px-4 pb-4">
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-300",
                                contextUsage.isCritical
                                    ? "bg-destructive"
                                    : contextUsage.isHigh
                                      ? "bg-yellow-500"
                                      : "bg-primary"
                            )}
                            style={{ width: `${contextUsage.percentage}%` }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                        <span>{formatNumber(contextUsage.currentTokens)}</span>
                        <span>{formatNumber(contextLimit)}</span>
                    </div>
                </div>
            ) : (
                <div className="px-4 pb-4">
                    <p className="text-xs text-muted-foreground">
                        No context data yet
                    </p>
                </div>
            )}
        </CollapsibleSection>
    );
}
