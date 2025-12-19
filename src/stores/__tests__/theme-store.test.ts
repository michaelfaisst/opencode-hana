import { act } from "@testing-library/react";
import { useThemeStore, getShikiTheme, THEMES } from "../theme-store";

describe("useThemeStore", () => {
    beforeEach(() => {
        localStorage.clear();
        // Reset to system theme
        act(() => {
            useThemeStore.getState().setTheme("system");
        });
    });

    describe("THEMES constant", () => {
        it("has at least 10 themes", () => {
            expect(THEMES.length).toBeGreaterThanOrEqual(10);
        });

        it("includes system, light, and dark themes", () => {
            const values = THEMES.map((t) => t.value);
            expect(values).toContain("system");
            expect(values).toContain("light");
            expect(values).toContain("dark");
        });

        it("includes custom themes", () => {
            const values = THEMES.map((t) => t.value);
            expect(values).toContain("catppuccin-mocha");
            expect(values).toContain("dracula");
            expect(values).toContain("nord");
            expect(values).toContain("tokyo-night");
        });

        it("has labels for all themes", () => {
            THEMES.forEach((theme) => {
                expect(theme.label).toBeDefined();
                expect(typeof theme.label).toBe("string");
                expect(theme.label.length).toBeGreaterThan(0);
            });
        });
    });

    describe("getShikiTheme", () => {
        it("returns github-light for light theme", () => {
            expect(getShikiTheme("light")).toBe("github-light");
        });

        it("returns github-dark for dark theme", () => {
            expect(getShikiTheme("dark")).toBe("github-dark");
        });

        it("returns matching Shiki theme for custom themes", () => {
            expect(getShikiTheme("catppuccin-mocha")).toBe("catppuccin-mocha");
            expect(getShikiTheme("dracula")).toBe("dracula");
            expect(getShikiTheme("nord")).toBe("nord");
            expect(getShikiTheme("one-dark")).toBe("one-dark-pro");
            expect(getShikiTheme("tokyo-night")).toBe("tokyo-night");
        });
    });

    describe("initial state", () => {
        it("has system as default theme", () => {
            expect(useThemeStore.getState().theme).toBe("system");
        });

        it("has a resolved theme (light or dark)", () => {
            const { resolvedTheme } = useThemeStore.getState();
            expect(["light", "dark"]).toContain(resolvedTheme);
        });
    });

    describe("setTheme", () => {
        it("sets theme to light", () => {
            act(() => {
                useThemeStore.getState().setTheme("light");
            });

            const state = useThemeStore.getState();
            expect(state.theme).toBe("light");
            expect(state.resolvedTheme).toBe("light");
        });

        it("sets theme to dark", () => {
            act(() => {
                useThemeStore.getState().setTheme("dark");
            });

            const state = useThemeStore.getState();
            expect(state.theme).toBe("dark");
            expect(state.resolvedTheme).toBe("dark");
        });

        it("sets custom themes", () => {
            act(() => {
                useThemeStore.getState().setTheme("dracula");
            });

            const state = useThemeStore.getState();
            expect(state.theme).toBe("dracula");
            expect(state.resolvedTheme).toBe("dracula");
        });

        it("resolves system theme to light or dark", () => {
            act(() => {
                useThemeStore.getState().setTheme("system");
            });

            const state = useThemeStore.getState();
            expect(state.theme).toBe("system");
            // resolvedTheme should be either light or dark based on matchMedia mock
            expect(["light", "dark"]).toContain(state.resolvedTheme);
        });

        it("applies theme class to document", () => {
            act(() => {
                useThemeStore.getState().setTheme("nord");
            });

            expect(document.documentElement.classList.contains("nord")).toBe(
                true
            );
        });

        it("removes previous theme class when switching", () => {
            act(() => {
                useThemeStore.getState().setTheme("dracula");
            });
            expect(document.documentElement.classList.contains("dracula")).toBe(
                true
            );

            act(() => {
                useThemeStore.getState().setTheme("nord");
            });
            expect(document.documentElement.classList.contains("dracula")).toBe(
                false
            );
            expect(document.documentElement.classList.contains("nord")).toBe(
                true
            );
        });
    });

    describe("initializeTheme", () => {
        it("returns a cleanup function", () => {
            let cleanup: (() => void) | undefined;
            act(() => {
                cleanup = useThemeStore.getState().initializeTheme();
            });

            expect(typeof cleanup).toBe("function");

            // Call cleanup
            act(() => {
                cleanup?.();
            });
        });

        it("applies current theme on initialization", () => {
            act(() => {
                useThemeStore.getState().setTheme("tokyo-night");
            });

            act(() => {
                useThemeStore.getState().initializeTheme();
            });

            expect(
                document.documentElement.classList.contains("tokyo-night")
            ).toBe(true);
        });
    });
});
