import { useQuery } from "@tanstack/react-query";
import { useOpencodeClient } from "@/providers";
import { QUERY_KEYS } from "@/lib/constants";

export interface Project {
  id: string;
  worktree: string;
  vcsDir?: string;
  vcs?: "git";
  time: {
    created: number;
    updated?: number;
    initialized?: number;
  };
}

/**
 * Get a display name from a project's worktree path
 * e.g., "/Users/michaelfaisst/Work/Private/opencode-web" -> "opencode-web"
 */
export function getProjectName(project: Project): string {
  if (project.worktree === "/") return "global";
  const parts = project.worktree.split("/").filter(Boolean);
  return parts[parts.length - 1] || project.worktree;
}

export function useProjects() {
  const client = useOpencodeClient();

  return useQuery({
    queryKey: QUERY_KEYS.projects,
    queryFn: async () => {
      console.log("[useProjects] fetching...");
      try {
        const response = await client.project.list();
        console.log("[useProjects] response:", response);
        if (response.error) {
          console.error("[useProjects] error:", response.error);
          throw new Error("Failed to fetch projects");
        }
        // Sort by most recently updated, filter out "global" root project
        const projects = (response.data ?? []) as Project[];
        console.log("[useProjects] projects count:", projects.length);
        return projects
          .filter((p) => p.worktree !== "/")
          .sort((a, b) => {
            const aTime = a.time.updated ?? a.time.created;
            const bTime = b.time.updated ?? b.time.created;
            return bTime - aTime;
          });
      } catch (err) {
        console.error("[useProjects] caught error:", err);
        throw err;
      }
    },
  });
}

export function useCurrentProject() {
  const client = useOpencodeClient();

  return useQuery({
    queryKey: [...QUERY_KEYS.projects, "current"],
    queryFn: async () => {
      const response = await client.project.current();
      if (response.error) {
        throw new Error("Failed to fetch current project");
      }
      return response.data as Project;
    },
  });
}
