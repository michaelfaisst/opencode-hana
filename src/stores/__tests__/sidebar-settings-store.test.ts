import { act } from "@testing-library/react";
import {
  useSidebarSettingsStore,
  DEFAULT_SECTIONS,
  type SidebarSectionId,
} from "../sidebar-settings-store";

describe("useSidebarSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset to default sections
    act(() => {
      useSidebarSettingsStore.getState().resetToDefaults();
    });
  });

  describe("DEFAULT_SECTIONS", () => {
    it("has 6 default sections", () => {
      expect(DEFAULT_SECTIONS).toHaveLength(6);
    });

    it("includes expected section IDs", () => {
      const ids = DEFAULT_SECTIONS.map((s) => s.id);
      expect(ids).toContain("actions");
      expect(ids).toContain("session-info");
      expect(ids).toContain("context-usage");
      expect(ids).toContain("changed-files");
      expect(ids).toContain("mcp-servers");
      expect(ids).toContain("tasks");
    });

    it("has all sections enabled by default", () => {
      expect(DEFAULT_SECTIONS.every((s) => s.enabled)).toBe(true);
    });
  });

  describe("initial state", () => {
    it("has sections matching DEFAULT_SECTIONS", () => {
      const { sections } = useSidebarSettingsStore.getState();
      expect(sections).toHaveLength(DEFAULT_SECTIONS.length);
      expect(sections.map((s) => s.id)).toEqual(DEFAULT_SECTIONS.map((s) => s.id));
    });
  });

  describe("updateSections", () => {
    it("replaces all sections", () => {
      const newSections = [
        { id: "actions" as SidebarSectionId, label: "Actions", enabled: false },
        { id: "tasks" as SidebarSectionId, label: "Tasks", enabled: true },
      ];

      act(() => {
        useSidebarSettingsStore.getState().updateSections(newSections);
      });

      const { sections } = useSidebarSettingsStore.getState();
      expect(sections).toHaveLength(2);
      expect(sections[0].enabled).toBe(false);
    });
  });

  describe("toggleSection", () => {
    it("toggles a section's enabled state", () => {
      const sectionId: SidebarSectionId = "actions";

      // Initially enabled
      expect(
        useSidebarSettingsStore.getState().sections.find((s) => s.id === sectionId)?.enabled
      ).toBe(true);

      act(() => {
        useSidebarSettingsStore.getState().toggleSection(sectionId);
      });

      expect(
        useSidebarSettingsStore.getState().sections.find((s) => s.id === sectionId)?.enabled
      ).toBe(false);

      act(() => {
        useSidebarSettingsStore.getState().toggleSection(sectionId);
      });

      expect(
        useSidebarSettingsStore.getState().sections.find((s) => s.id === sectionId)?.enabled
      ).toBe(true);
    });

    it("only affects the targeted section", () => {
      act(() => {
        useSidebarSettingsStore.getState().toggleSection("actions");
      });

      const { sections } = useSidebarSettingsStore.getState();
      const actionsSection = sections.find((s) => s.id === "actions");
      const tasksSection = sections.find((s) => s.id === "tasks");

      expect(actionsSection?.enabled).toBe(false);
      expect(tasksSection?.enabled).toBe(true);
    });
  });

  describe("reorderSections", () => {
    it("moves a section from one index to another", () => {
      // Get initial order
      const initialSections = useSidebarSettingsStore.getState().sections;
      const firstId = initialSections[0].id;
      const secondId = initialSections[1].id;

      // Move first section to second position
      act(() => {
        useSidebarSettingsStore.getState().reorderSections(0, 1);
      });

      const reorderedSections = useSidebarSettingsStore.getState().sections;
      expect(reorderedSections[0].id).toBe(secondId);
      expect(reorderedSections[1].id).toBe(firstId);
    });

    it("handles moving to the end", () => {
      const initialSections = useSidebarSettingsStore.getState().sections;
      const firstId = initialSections[0].id;

      act(() => {
        useSidebarSettingsStore.getState().reorderSections(0, 5);
      });

      const reorderedSections = useSidebarSettingsStore.getState().sections;
      expect(reorderedSections[5].id).toBe(firstId);
    });
  });

  describe("resetToDefaults", () => {
    it("restores sections to DEFAULT_SECTIONS", () => {
      // Modify sections
      act(() => {
        useSidebarSettingsStore.getState().toggleSection("actions");
        useSidebarSettingsStore.getState().reorderSections(0, 3);
      });

      // Reset
      act(() => {
        useSidebarSettingsStore.getState().resetToDefaults();
      });

      const { sections } = useSidebarSettingsStore.getState();
      expect(sections).toEqual(DEFAULT_SECTIONS);
    });
  });
});
