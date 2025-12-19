import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UILayoutStore {
  // Sidebar collapsed states
  sessionsSidebarCollapsed: boolean;
  chatSidebarCollapsed: boolean;

  // Mobile sheet states (not persisted)
  mobileSessionsSheetOpen: boolean;
  mobileChatSheetOpen: boolean;

  // Collapsible section states (keyed by section ID)
  collapsedSections: Record<string, boolean>;

  // Actions
  toggleSessionsSidebar: () => void;
  setSessionsSidebarCollapsed: (collapsed: boolean) => void;
  toggleChatSidebar: () => void;
  setChatSidebarCollapsed: (collapsed: boolean) => void;
  setSectionCollapsed: (key: string, collapsed: boolean) => void;
  toggleSection: (key: string) => void;
  isSectionCollapsed: (key: string, defaultOpen?: boolean) => boolean;

  // Mobile sheet actions
  setMobileSessionsSheetOpen: (open: boolean) => void;
  setMobileChatSheetOpen: (open: boolean) => void;
}

export const useUILayoutStore = create<UILayoutStore>()(
  persist(
    (set, get) => ({
      // Default states
      sessionsSidebarCollapsed: false,
      chatSidebarCollapsed: false,
      collapsedSections: {},

      // Mobile sheet states (not persisted via partialize)
      mobileSessionsSheetOpen: false,
      mobileChatSheetOpen: false,

      // Sessions sidebar
      toggleSessionsSidebar: () =>
        set((state) => ({
          sessionsSidebarCollapsed: !state.sessionsSidebarCollapsed,
        })),
      setSessionsSidebarCollapsed: (collapsed) =>
        set({ sessionsSidebarCollapsed: collapsed }),

      // Chat sidebar
      toggleChatSidebar: () =>
        set((state) => ({
          chatSidebarCollapsed: !state.chatSidebarCollapsed,
        })),
      setChatSidebarCollapsed: (collapsed) =>
        set({ chatSidebarCollapsed: collapsed }),

      // Mobile sheet actions
      setMobileSessionsSheetOpen: (open) =>
        set({ mobileSessionsSheetOpen: open }),
      setMobileChatSheetOpen: (open) =>
        set({ mobileChatSheetOpen: open }),

      // Collapsible sections
      setSectionCollapsed: (key, collapsed) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [key]: collapsed,
          },
        })),
      toggleSection: (key) =>
        set((state) => ({
          collapsedSections: {
            ...state.collapsedSections,
            [key]: !state.collapsedSections[key],
          },
        })),
      isSectionCollapsed: (key, defaultOpen = true) => {
        const state = get();
        if (key in state.collapsedSections) {
          return state.collapsedSections[key];
        }
        // Return opposite of defaultOpen (collapsed = !open)
        return !defaultOpen;
      },
    }),
    {
      name: "opencode-ui-layout",
      // Only persist sidebar collapsed states and sections, not mobile sheet state
      partialize: (state) => ({
        sessionsSidebarCollapsed: state.sessionsSidebarCollapsed,
        chatSidebarCollapsed: state.chatSidebarCollapsed,
        collapsedSections: state.collapsedSections,
      }),
    }
  )
);
