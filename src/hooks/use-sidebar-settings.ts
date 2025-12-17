import { useCallback, useSyncExternalStore } from "react";

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

export interface SidebarSettings {
  sections: SidebarSection[];
}

const STORAGE_KEY = "sidebar-settings";

export const DEFAULT_SECTIONS: SidebarSection[] = [
  { id: "actions", label: "Actions", enabled: true },
  { id: "session-info", label: "Session Info", enabled: true },
  { id: "context-usage", label: "Context", enabled: true },
  { id: "changed-files", label: "Changed Files", enabled: true },
  { id: "mcp-servers", label: "MCP Servers", enabled: true },
  { id: "tasks", label: "Tasks", enabled: true },
];

// In-memory cache for the settings
let cachedSettings: SidebarSettings | null = null;

// Listeners for external store
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function loadSettings(): SidebarSettings {
  if (cachedSettings) return cachedSettings;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate parsed data shape
      if (!parsed?.sections || !Array.isArray(parsed.sections)) {
        throw new Error("Invalid settings shape");
      }
      // Merge with defaults to handle new sections
      const mergedSections = DEFAULT_SECTIONS.map((defaultSection) => {
        const storedSection = parsed.sections.find(
          (s: SidebarSection) => s.id === defaultSection.id
        );
        return storedSection ?? defaultSection;
      });
      // Preserve order from stored settings
      const orderedSections = parsed.sections
        .filter((s: SidebarSection) => mergedSections.some((m) => m.id === s.id))
        .map((s: SidebarSection) => mergedSections.find((m) => m.id === s.id)!);
      // Add any new sections not in stored settings
      const newSections = mergedSections.filter(
        (m) => !orderedSections.some((o: SidebarSection) => o.id === m.id)
      );
      cachedSettings = { sections: [...orderedSections, ...newSections] };
      return cachedSettings;
    }
  } catch {
    // Fall through to default
  }

  cachedSettings = { sections: DEFAULT_SECTIONS };
  return cachedSettings;
}

function saveSettings(settings: SidebarSettings): void {
  cachedSettings = settings;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage might be full or unavailable
  }
  notifyListeners();
}

function getSnapshot(): SidebarSettings {
  return loadSettings();
}

function getServerSnapshot(): SidebarSettings {
  return { sections: DEFAULT_SECTIONS };
}

export function useSidebarSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const updateSections = useCallback((sections: SidebarSection[]) => {
    saveSettings({ sections });
  }, []);

  const toggleSection = useCallback((sectionId: SidebarSectionId) => {
    const current = loadSettings();
    const newSections = current.sections.map((section) =>
      section.id === sectionId
        ? { ...section, enabled: !section.enabled }
        : section
    );
    saveSettings({ sections: newSections });
  }, []);

  const reorderSections = useCallback(
    (fromIndex: number, toIndex: number) => {
      const current = loadSettings();
      const newSections = [...current.sections];
      const [removed] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, removed);
      saveSettings({ sections: newSections });
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    saveSettings({ sections: DEFAULT_SECTIONS });
  }, []);

  return {
    settings,
    updateSections,
    toggleSection,
    reorderSections,
    resetToDefaults,
  };
}
