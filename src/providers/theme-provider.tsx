/* eslint-disable react-refresh/only-export-components */
import { useEffect, type ReactNode } from "react";
import { useThemeStore } from "@/stores";

export function ThemeProvider({ children }: { children: ReactNode }) {
    const initializeTheme = useThemeStore((state) => state.initializeTheme);

    useEffect(() => {
        const cleanup = initializeTheme();
        return cleanup;
    }, [initializeTheme]);

    return <>{children}</>;
}

// Re-export the hook from the store for backwards compatibility
export function useTheme() {
    const theme = useThemeStore((state) => state.theme);
    const setTheme = useThemeStore((state) => state.setTheme);
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);

    return { theme, setTheme, resolvedTheme };
}
