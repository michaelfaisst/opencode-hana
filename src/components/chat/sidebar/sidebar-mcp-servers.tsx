import {
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CollapsibleSection } from "./collapsible-section";
import { Switch } from "@/components/ui/switch";
import type { McpServersProps } from "./types";
import type { McpServer, McpStatus } from "@/hooks/use-mcp-servers";
import { useConnectMcpServer, useDisconnectMcpServer } from "@/hooks";

export function SidebarMcpServers({ servers, isLoading }: McpServersProps) {
  const connectedCount = servers.filter(
    (s) => s.status.status === "connected"
  ).length;

  const badge =
    servers.length > 0 ? (
      <span className="text-xs text-muted-foreground">
        {connectedCount}/{servers.length}
      </span>
    ) : null;

  return (
    <CollapsibleSection
      title="MCP Servers"
      icon={<Server className="h-4 w-4" />}
      badge={badge}
      defaultOpen={true}
      storageKey="mcp-servers"
      className="border-b border-border"
    >
      {isLoading ? (
        <div className="px-4 pb-4 flex items-center gap-2">
          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Loading...</span>
        </div>
      ) : servers.length > 0 ? (
        <div className="px-2 pb-2 space-y-1">
          {servers.map((server) => (
            <McpServerRow key={server.name} server={server} />
          ))}
        </div>
      ) : (
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground">No MCP servers configured</p>
        </div>
      )}
    </CollapsibleSection>
  );
}

interface McpServerRowProps {
  server: McpServer;
}

function getStatusInfo(status: McpStatus): {
  icon: React.ReactNode;
  label: string;
  className: string;
  isConnected: boolean;
} {
  switch (status.status) {
    case "connected":
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
        label: "Connected",
        className: "",
        isConnected: true,
      };
    case "disabled":
      return {
        icon: <XCircle className="h-3.5 w-3.5 text-muted-foreground" />,
        label: "Disabled",
        className: "opacity-60",
        isConnected: false,
      };
    case "failed":
      return {
        icon: <AlertCircle className="h-3.5 w-3.5 text-red-500" />,
        label: status.error || "Failed",
        className: "",
        isConnected: false,
      };
    case "needs_auth":
      return {
        icon: <Lock className="h-3.5 w-3.5 text-yellow-500" />,
        label: "Needs authentication",
        className: "",
        isConnected: false,
      };
    case "needs_client_registration":
      return {
        icon: <AlertCircle className="h-3.5 w-3.5 text-yellow-500" />,
        label: status.error || "Needs client registration",
        className: "",
        isConnected: false,
      };
    default:
      return {
        icon: <AlertCircle className="h-3.5 w-3.5 text-muted-foreground" />,
        label: "Unknown",
        className: "opacity-60",
        isConnected: false,
      };
  }
}

function McpServerRow({ server }: McpServerRowProps) {
  const { icon, label, className, isConnected } = getStatusInfo(server.status);
  const connectMutation = useConnectMcpServer();
  const disconnectMutation = useDisconnectMcpServer();

  const isLoading = connectMutation.isPending || disconnectMutation.isPending;

  const handleToggle = (checked: boolean) => {
    if (isLoading) return;
    
    if (checked) {
      connectMutation.mutate(server.name);
    } else {
      disconnectMutation.mutate(server.name);
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-sm",
        className
      )}
      title={label}
    >
      <div className="shrink-0">{icon}</div>
      <p className="text-xs truncate flex-1">{server.name}</p>
      <div className="shrink-0 flex items-center">
        {isLoading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
        ) : (
          <Switch
            size="sm"
            checked={isConnected}
            onCheckedChange={handleToggle}
          />
        )}
      </div>
    </div>
  );
}
