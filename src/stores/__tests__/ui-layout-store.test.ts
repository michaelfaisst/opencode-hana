import { act } from "@testing-library/react";
import { useUILayoutStore } from "../ui-layout-store";

describe("useUILayoutStore", () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset store state
        act(() => {
            const store = useUILayoutStore.getState();
            store.setSessionsSidebarCollapsed(false);
            store.setChatSidebarCollapsed(false);
            store.setMobileSessionsSheetOpen(false);
            store.setMobileChatSheetOpen(false);
            store.setSessionsSidebarWidth(320);
            store.setChatSidebarWidth(288);
            // Clear collapsed sections by setting them all to not collapsed
        });
    });

    describe("initial state", () => {
        it("has sidebars not collapsed by default", () => {
            const state = useUILayoutStore.getState();
            expect(state.sessionsSidebarCollapsed).toBe(false);
            expect(state.chatSidebarCollapsed).toBe(false);
        });

        it("has mobile sheets closed by default", () => {
            const state = useUILayoutStore.getState();
            expect(state.mobileSessionsSheetOpen).toBe(false);
            expect(state.mobileChatSheetOpen).toBe(false);
        });

        it("has default sidebar widths", () => {
            const state = useUILayoutStore.getState();
            expect(state.sessionsSidebarWidth).toBe(320);
            expect(state.chatSidebarWidth).toBe(288);
        });
    });

    describe("sessions sidebar", () => {
        it("toggleSessionsSidebar toggles the collapsed state", () => {
            expect(useUILayoutStore.getState().sessionsSidebarCollapsed).toBe(
                false
            );

            act(() => {
                useUILayoutStore.getState().toggleSessionsSidebar();
            });
            expect(useUILayoutStore.getState().sessionsSidebarCollapsed).toBe(
                true
            );

            act(() => {
                useUILayoutStore.getState().toggleSessionsSidebar();
            });
            expect(useUILayoutStore.getState().sessionsSidebarCollapsed).toBe(
                false
            );
        });

        it("setSessionsSidebarCollapsed sets specific value", () => {
            act(() => {
                useUILayoutStore.getState().setSessionsSidebarCollapsed(true);
            });
            expect(useUILayoutStore.getState().sessionsSidebarCollapsed).toBe(
                true
            );

            act(() => {
                useUILayoutStore.getState().setSessionsSidebarCollapsed(false);
            });
            expect(useUILayoutStore.getState().sessionsSidebarCollapsed).toBe(
                false
            );
        });
    });

    describe("chat sidebar", () => {
        it("toggleChatSidebar toggles the collapsed state", () => {
            expect(useUILayoutStore.getState().chatSidebarCollapsed).toBe(
                false
            );

            act(() => {
                useUILayoutStore.getState().toggleChatSidebar();
            });
            expect(useUILayoutStore.getState().chatSidebarCollapsed).toBe(true);

            act(() => {
                useUILayoutStore.getState().toggleChatSidebar();
            });
            expect(useUILayoutStore.getState().chatSidebarCollapsed).toBe(
                false
            );
        });

        it("setChatSidebarCollapsed sets specific value", () => {
            act(() => {
                useUILayoutStore.getState().setChatSidebarCollapsed(true);
            });
            expect(useUILayoutStore.getState().chatSidebarCollapsed).toBe(true);
        });
    });

    describe("mobile sheets", () => {
        it("setMobileSessionsSheetOpen updates state", () => {
            act(() => {
                useUILayoutStore.getState().setMobileSessionsSheetOpen(true);
            });
            expect(useUILayoutStore.getState().mobileSessionsSheetOpen).toBe(
                true
            );

            act(() => {
                useUILayoutStore.getState().setMobileSessionsSheetOpen(false);
            });
            expect(useUILayoutStore.getState().mobileSessionsSheetOpen).toBe(
                false
            );
        });

        it("setMobileChatSheetOpen updates state", () => {
            act(() => {
                useUILayoutStore.getState().setMobileChatSheetOpen(true);
            });
            expect(useUILayoutStore.getState().mobileChatSheetOpen).toBe(true);
        });
    });

    describe("sidebar widths", () => {
        it("setSessionsSidebarWidth updates the width", () => {
            act(() => {
                useUILayoutStore.getState().setSessionsSidebarWidth(400);
            });
            expect(useUILayoutStore.getState().sessionsSidebarWidth).toBe(400);
        });

        it("setChatSidebarWidth updates the width", () => {
            act(() => {
                useUILayoutStore.getState().setChatSidebarWidth(350);
            });
            expect(useUILayoutStore.getState().chatSidebarWidth).toBe(350);
        });

        it("sidebar widths can be set to minimum values", () => {
            act(() => {
                useUILayoutStore.getState().setSessionsSidebarWidth(200);
                useUILayoutStore.getState().setChatSidebarWidth(200);
            });
            expect(useUILayoutStore.getState().sessionsSidebarWidth).toBe(200);
            expect(useUILayoutStore.getState().chatSidebarWidth).toBe(200);
        });

        it("sidebar widths can be set to large values", () => {
            act(() => {
                useUILayoutStore.getState().setSessionsSidebarWidth(600);
                useUILayoutStore.getState().setChatSidebarWidth(500);
            });
            expect(useUILayoutStore.getState().sessionsSidebarWidth).toBe(600);
            expect(useUILayoutStore.getState().chatSidebarWidth).toBe(500);
        });
    });

    describe("collapsible sections", () => {
        it("setSectionCollapsed sets a section to collapsed", () => {
            act(() => {
                useUILayoutStore
                    .getState()
                    .setSectionCollapsed("test-section", true);
            });

            const state = useUILayoutStore.getState();
            expect(state.collapsedSections["test-section"]).toBe(true);
        });

        it("toggleSection toggles section collapsed state", () => {
            act(() => {
                useUILayoutStore
                    .getState()
                    .setSectionCollapsed("toggle-test", false);
            });
            expect(
                useUILayoutStore.getState().collapsedSections["toggle-test"]
            ).toBe(false);

            act(() => {
                useUILayoutStore.getState().toggleSection("toggle-test");
            });
            expect(
                useUILayoutStore.getState().collapsedSections["toggle-test"]
            ).toBe(true);

            act(() => {
                useUILayoutStore.getState().toggleSection("toggle-test");
            });
            expect(
                useUILayoutStore.getState().collapsedSections["toggle-test"]
            ).toBe(false);
        });

        it("isSectionCollapsed returns correct state for known sections", () => {
            act(() => {
                useUILayoutStore
                    .getState()
                    .setSectionCollapsed("known-section", true);
            });

            expect(
                useUILayoutStore.getState().isSectionCollapsed("known-section")
            ).toBe(true);
        });

        it("isSectionCollapsed uses defaultOpen for unknown sections", () => {
            // Default open = true means collapsed = false
            expect(
                useUILayoutStore
                    .getState()
                    .isSectionCollapsed("unknown-section", true)
            ).toBe(false);

            // Default open = false means collapsed = true
            expect(
                useUILayoutStore
                    .getState()
                    .isSectionCollapsed("another-unknown", false)
            ).toBe(true);
        });
    });
});
