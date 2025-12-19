import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useOpencodeClient } from "@/providers";
import { QUERY_KEYS } from "@/lib/constants";

export type McpStatus =
  | { status: "connected" }
  | { status: "disabled" }
  | { status: "failed"; error: string }
  | { status: "needs_auth" }
  | { status: "needs_client_registration"; error: string };

export interface McpServer {
  name: string;
  status: McpStatus;
}

export function useMcpServers() {
  const client = useOpencodeClient();

  return useQuery({
    queryKey: QUERY_KEYS.mcpServers,
    queryFn: async () => {
      const response = await client.mcp.status();
      if (response.error) {
        throw new Error("Failed to fetch MCP servers");
      }
      // Transform the object into an array of servers
      const data = response.data ?? {};
      const servers: McpServer[] = Object.entries(data).map(([name, status]) => ({
        name,
        status: status as McpStatus,
      }));
      return servers;
    },
  });
}

export function useConnectMcpServer() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await client.mcp.connect({ path: { name } });
      if (response.error) {
        throw new Error("Failed to connect MCP server");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpServers });
    },
  });
}

export function useDisconnectMcpServer() {
  const client = useOpencodeClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const response = await client.mcp.disconnect({ path: { name } });
      if (response.error) {
        throw new Error("Failed to disconnect MCP server");
      }
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.mcpServers });
    },
  });
}
