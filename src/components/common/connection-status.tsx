import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({
  isConnected,
  className,
}: ConnectionStatusProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs",
        isConnected ? "text-green-500" : "text-destructive",
        className
      )}
    >
      {isConnected ? (
        <>
          <Wifi className="h-3 w-3" />
          <span>Connected</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
}
