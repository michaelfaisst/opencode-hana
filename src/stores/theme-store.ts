import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light" | "system";

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(resolvedTheme: "dark" | "light") {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(resolvedTheme);
}

interface ThemeStore {
  theme: Theme;
  resolvedTheme: "dark" | "light";
  setTheme: (theme: Theme) => void;
  initializeTheme: () => () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: getSystemTheme(),

      setTheme: (theme) => {
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      initializeTheme: () => {
        // Apply theme on initialization
        const { theme } = get();
        const resolvedTheme = theme === "system" ? getSystemTheme() : theme;
        set({ resolvedTheme });
        applyTheme(resolvedTheme);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        const handleChange = () => {
          const currentTheme = get().theme;
          if (currentTheme === "system") {
            const newResolvedTheme = getSystemTheme();
            set({ resolvedTheme: newResolvedTheme });
            applyTheme(newResolvedTheme);
          }
        };

        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      },
    }),
    {
      name: "theme",
      partialize: (state) => ({ theme: state.theme }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, compute the resolved theme and apply it
        if (state) {
          const resolvedTheme =
            state.theme === "system" ? getSystemTheme() : state.theme;
          state.resolvedTheme = resolvedTheme;
          applyTheme(resolvedTheme);
        }
      },
    }
  )
);
