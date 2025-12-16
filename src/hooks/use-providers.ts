import { useQuery } from "@tanstack/react-query";
import { useOpencodeClient } from "@/providers";
import { QUERY_KEYS } from "@/lib/constants";

export function useProviders() {
  const client = useOpencodeClient();

  return useQuery({
    queryKey: QUERY_KEYS.providers,
    queryFn: async () => {
      const response = await client.config.providers();
      if (response.error) {
        throw new Error("Failed to fetch providers");
      }
      return response.data;
    },
  });
}
