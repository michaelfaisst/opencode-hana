import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BundledTheme } from "shiki";

export type Theme =
  | "dark"
  | "light"
  | "system"
  | "catppuccin-latte"
  | "catppuccin-mocha"
  | "dracula"
  | "monokai"
  | "nord"
  | "one-dark"
  | "synthwave-84"
  | "tokyo-night";

// All possible resolved themes (CSS class names)
export type ResolvedTheme = Exclude<Theme, "system">;

// Theme metadata for UI display
export const THEMES: { value: Theme; label: string; description?: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System", description: "Follow system preference" },
  {
    value: "catppuccin-latte",
    label: "Catppuccin Latte",
    description: "Soothing pastel light theme",
  },
  {
    value: "catppuccin-mocha",
    label: "Catppuccin Mocha",
    description: "Soothing pastel dark theme",
  },
  { value: "dracula", label: "Dracula", description: "Dark theme with vibrant colors" },
  { value: "monokai", label: "Monokai", description: "Classic dark editor theme" },
  { value: "nord", label: "Nord", description: "Arctic, north-bluish color palette" },
  { value: "one-dark", label: "One Dark", description: "Atom's iconic dark theme" },
  {
    value: "synthwave-84",
    label: "Synthwave '84",
    description: "Retro-futuristic neon glow theme",
  },
  {
    value: "tokyo-night",
    label: "Tokyo Night",
    description: "Clean dark theme inspired by Tokyo lights",
  },
];

// All theme class names for removal
const ALL_THEME_CLASSES: ResolvedTheme[] = [
  "light",
  "dark",
  "catppuccin-latte",
  "catppuccin-mocha",
  "dracula",
  "monokai",
  "nord",
  "one-dark",
  "synthwave-84",
  "tokyo-night",
];

// Map app themes to Shiki syntax highlighting themes
const SHIKI_THEME_MAP: Record<ResolvedTheme, BundledTheme> = {
  light: "github-light",
  dark: "github-dark",
  "catppuccin-latte": "catppuccin-latte",
  "catppuccin-mocha": "catppuccin-mocha",
  dracula: "dracula",
  monokai: "monokai",
  nord: "nord",
  "one-dark": "one-dark-pro",
  "synthwave-84": "synthwave-84",
  "tokyo-night": "tokyo-night",
};

/**
 * Get the Shiki theme for syntax highlighting based on the current app theme.
 */
export function getShikiTheme(resolvedTheme: ResolvedTheme): BundledTheme {
  return SHIKI_THEME_MAP[resolvedTheme];
}

function getSystemTheme(): "dark" | "light" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") {
    return getSystemTheme();
  }
  return theme;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  if (typeof window === "undefined") return;
  const root = window.document.documentElement;
  // Remove all theme classes
  root.classList.remove(...ALL_THEME_CLASSES);
  root.classList.add(resolvedTheme);
}

interface ThemeStore {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => () => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolvedTheme: getSystemTheme(),

      setTheme: (theme) => {
        const resolvedTheme = resolveTheme(theme);
        set({ theme, resolvedTheme });
        applyTheme(resolvedTheme);
      },

      initializeTheme: () => {
        // Apply theme on initialization
        const { theme } = get();
        const resolvedTheme = resolveTheme(theme);
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
          const resolvedTheme = resolveTheme(state.theme);
          state.resolvedTheme = resolvedTheme;
          applyTheme(resolvedTheme);
        }
      },
    }
  )
);
