import { Circle, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface SidebarFooterProps {
    isConnected: boolean;
    opencodeVersion?: string;
}

export function SidebarFooter({
    isConnected,
    opencodeVersion
}: SidebarFooterProps) {
    const serverUrl =
        import.meta.env.VITE_OPENCODE_SERVER_URL || "localhost:4096";
    // Extract just the host part for display
    const displayUrl = serverUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

    return (
        <div className="border-t border-border p-2 space-y-2">
            {/* Connection status */}
            <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                    <Circle
                        className={cn(
                            "h-2 w-2 fill-current",
                            isConnected ? "text-green-500" : "text-destructive"
                        )}
                    />
                    <span
                        className={cn(
                            isConnected ? "text-green-500" : "text-destructive"
                        )}
                    >
                        {isConnected ? "Connected" : "Disconnected"}
                    </span>
                </div>
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <Link to="/settings">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                >
                                    <Settings className="h-3 w-3" />
                                </Button>
                            </Link>
                        }
                    />
                    <TooltipContent>Settings</TooltipContent>
                </Tooltip>
            </div>

            {/* Server URL and versions */}
            <div className="text-[10px] text-muted-foreground space-y-0.5">
                <div className="truncate" title={serverUrl}>
                    {displayUrl}
                </div>
                <div className="flex items-center gap-2">
                    <span>Hana v{__APP_VERSION__}</span>
                    {opencodeVersion && (
                        <span>OpenCode v{opencodeVersion}</span>
                    )}
                </div>
            </div>
        </div>
    );
}
