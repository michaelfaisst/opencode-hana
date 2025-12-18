import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SidebarSectionId =
  | "actions"
  | "session-info"
  | "context-usage"
  | "changed-files"
  | "mcp-servers"
  | "tasks";

export interface SidebarSection {
  id: SidebarSectionId;
  label: string;
  enabled: boolean;
}

export const DEFAULT_SECTIONS: SidebarSection[] = [
  { id: "actions", label: "Actions", enabled: true },
  { id: "session-info", label: "Session Info", enabled: true },
  { id: "context-usage", label: "Context", enabled: true },
  { id: "changed-files", label: "Changed Files", enabled: true },
  { id: "mcp-servers", label: "MCP Servers", enabled: true },
  { id: "tasks", label: "Tasks", enabled: true },
];

interface SidebarSettingsStore {
  sections: SidebarSection[];
  updateSections: (sections: SidebarSection[]) => void;
  toggleSection: (sectionId: SidebarSectionId) => void;
  reorderSections: (fromIndex: number, toIndex: number) => void;
  resetToDefaults: () => void;
}

export const useSidebarSettingsStore = create<SidebarSettingsStore>()(
  persist(
    (set) => ({
      sections: DEFAULT_SECTIONS,

      updateSections: (sections) => set({ sections }),

      toggleSection: (sectionId) =>
        set((state) => ({
          sections: state.sections.map((section) =>
            section.id === sectionId
              ? { ...section, enabled: !section.enabled }
              : section
          ),
        })),

      reorderSections: (fromIndex, toIndex) =>
        set((state) => {
          const newSections = [...state.sections];
          const [removed] = newSections.splice(fromIndex, 1);
          newSections.splice(toIndex, 0, removed);
          return { sections: newSections };
        }),

      resetToDefaults: () => set({ sections: DEFAULT_SECTIONS }),
    }),
    {
      name: "sidebar-settings",
      // Merge stored sections with defaults to handle new sections added in updates
      merge: (persisted, current) => {
        const persistedState = persisted as Partial<SidebarSettingsStore> | undefined;
        if (!persistedState?.sections) {
          return current;
        }

        // Merge with defaults to handle new sections
        const mergedSections = DEFAULT_SECTIONS.map((defaultSection) => {
          const storedSection = persistedState.sections!.find(
            (s) => s.id === defaultSection.id
          );
          return storedSection ?? defaultSection;
        });

        // Preserve order from stored settings
        const orderedSections = persistedState
          .sections!.filter((s) => mergedSections.some((m) => m.id === s.id))
          .map((s) => mergedSections.find((m) => m.id === s.id)!);

        // Add any new sections not in stored settings
        const newSections = mergedSections.filter(
          (m) => !orderedSections.some((o) => o.id === m.id)
        );

        return {
          ...current,
          sections: [...orderedSections, ...newSections],
        };
      },
    }
  )
);
