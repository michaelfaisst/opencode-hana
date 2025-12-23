/* eslint-disable react-refresh/only-export-components */
import { type ReactNode } from "react";
import { QueryProvider } from "./query-provider";
import { OpencodeProvider } from "./opencode-provider";
import { ThemeProvider } from "./theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function AppProviders({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider>
            <QueryProvider>
                <OpencodeProvider>
                    <TooltipProvider>{children}</TooltipProvider>
                </OpencodeProvider>
            </QueryProvider>
        </ThemeProvider>
    );
}

export { useOpencodeClient } from "./opencode-provider";
export { useTheme } from "./theme-provider";
export { queryClient } from "./query-provider";
export {
    EventsProvider,
    useEventsContext,
    useSessionStatusFromContext
} from "./events-provider";
