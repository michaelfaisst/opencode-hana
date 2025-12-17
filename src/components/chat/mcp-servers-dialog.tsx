import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Server,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  useMcpServers,
  useConnectMcpServer,
  useDisconnectMcpServer,
  type McpServer,
  type McpStatus,
} from "@/hooks/use-mcp-servers";

interface McpServersDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Callback when open state changes */
  onOpenChange: (open: boolean) => void;
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
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
        label: "Connected",
        className: "",
        isConnected: true,
      };
    case "disabled":
      return {
        icon: <XCircle className="h-4 w-4 text-muted-foreground" />,
        label: "Disabled",
        className: "opacity-60",
        isConnected: false,
      };
    case "failed":
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        label: status.error || "Failed",
        className: "",
        isConnected: false,
      };
    case "needs_auth":
      return {
        icon: <Lock className="h-4 w-4 text-yellow-500" />,
        label: "Needs authentication",
        className: "",
        isConnected: false,
      };
    case "needs_client_registration":
      return {
        icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
        label: status.error || "Needs client registration",
        className: "",
        isConnected: false,
      };
    default:
      return {
        icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
        label: "Unknown",
        className: "opacity-60",
        isConnected: false,
      };
  }
}

export function McpServersDialog({ open, onOpenChange }: McpServersDialogProps) {
  const { data: servers = [], isLoading } = useMcpServers();
  const connectMutation = useConnectMcpServer();
  const disconnectMutation = useDisconnectMcpServer();
  
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Handle dialog open state change with selection reset
  const handleOpenChange = useCallback((isOpen: boolean) => {
    if (isOpen) {
      setSelectedIndex(0);
    }
    onOpenChange(isOpen);
  }, [onOpenChange]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  const toggleServer = useCallback((server: McpServer) => {
    const { isConnected } = getStatusInfo(server.status);
    if (connectMutation.isPending || disconnectMutation.isPending) return;
    
    if (isConnected) {
      disconnectMutation.mutate(server.name);
    } else {
      connectMutation.mutate(server.name);
    }
  }, [connectMutation, disconnectMutation]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (servers.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % servers.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + servers.length) % servers.length);
        break;
      case " ":
        e.preventDefault();
        toggleServer(servers[selectedIndex]);
        break;
      case "Enter":
        e.preventDefault();
        toggleServer(servers[selectedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        handleOpenChange(false);
        break;
    }
  }, [servers, selectedIndex, toggleServer, handleOpenChange]);

  const connectedCount = servers.filter(
    (s) => s.status.status === "connected"
  ).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            MCP Servers
          </DialogTitle>
          <DialogDescription>
            {servers.length > 0 
              ? `${connectedCount} of ${servers.length} servers connected. Use arrow keys to navigate, space to toggle.`
              : "Manage your MCP server connections."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div 
          ref={listRef}
          className="py-2 max-h-[300px] overflow-y-auto focus:outline-none"
          tabIndex={0}
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading servers...</span>
            </div>
          ) : servers.length > 0 ? (
            <div className="space-y-1">
              {servers.map((server, index) => (
                <McpServerItem
                  key={server.name}
                  ref={(el) => { itemRefs.current[index] = el; }}
                  server={server}
                  isSelected={index === selectedIndex}
                  isLoading={
                    (connectMutation.isPending && connectMutation.variables === server.name) ||
                    (disconnectMutation.isPending && disconnectMutation.variables === server.name)
                  }
                  onClick={() => {
                    setSelectedIndex(index);
                    toggleServer(server);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Server className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No MCP servers configured</p>
              <p className="text-xs text-muted-foreground mt-1">
                Add servers in your opencode configuration
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-muted-foreground border-t border-border pt-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">↑↓</kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">space</kbd>
              toggle
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface McpServerItemProps {
  server: McpServer;
  isSelected: boolean;
  isLoading: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
}

import { forwardRef } from "react";

const McpServerItem = forwardRef<HTMLDivElement, McpServerItemProps>(
  function McpServerItem({ server, isSelected, isLoading, onClick, onMouseEnter }, ref) {
    const { icon, label, className, isConnected } = getStatusInfo(server.status);

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-sm cursor-pointer transition-colors",
          isSelected ? "bg-accent" : "hover:bg-accent/50",
          className
        )}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        role="option"
        aria-selected={isSelected}
      >
        <div className="shrink-0">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            icon
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{server.name}</p>
          <p className="text-xs text-muted-foreground truncate">{label}</p>
        </div>
        <div className="shrink-0">
          <div
            className={cn(
              "w-8 h-5 rounded-full transition-colors relative",
              isConnected ? "bg-green-500" : "bg-muted-foreground/30"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform",
                isConnected ? "translate-x-3.5" : "translate-x-0.5"
              )}
            />
          </div>
        </div>
      </div>
    );
  }
);
