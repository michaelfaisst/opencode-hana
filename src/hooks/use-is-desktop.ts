import { useMediaQuery } from "react-responsive";

/**
 * Hook to detect if the viewport is at desktop size (≥1024px).
 * This matches Tailwind's `lg` breakpoint.
 * @returns Whether the viewport is desktop-sized
 */
export function useIsDesktop(): boolean {
    return useMediaQuery({ minWidth: 1024 });
}
