import { useCallback, type ReactNode } from "react";
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate,
    useNavigate
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AppProviders, EventsProvider } from "@/providers";
import { RootLayout } from "@/components/layout";
import { ErrorBoundary } from "@/components/common";
import { HomePage, SettingsPage } from "@/routes";
import { Toaster } from "@/components/ui/sonner";
import { QUERY_KEYS } from "@/lib/constants";
import type { Session } from "@opencode-ai/sdk/client";

/**
 * Wrapper component that provides navigation and session lookup to EventsProvider.
 * Must be inside BrowserRouter to use useNavigate().
 */
function EventsProviderWithNavigation({ children }: { children: ReactNode }) {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const navigateToSession = useCallback(
        (sessionId: string) => {
            navigate(`/sessions/${sessionId}`);
        },
        [navigate]
    );

    const getSessionTitle = useCallback(
        (sessionId: string): string | undefined => {
            const sessions = queryClient.getQueryData<Session[]>(
                QUERY_KEYS.sessions
            );
            return sessions?.find((s) => s.id === sessionId)?.title;
        },
        [queryClient]
    );

    return (
        <EventsProvider
            navigateToSession={navigateToSession}
            getSessionTitle={getSessionTitle}
        >
            {children}
        </EventsProvider>
    );
}

export function App() {
    return (
        <ErrorBoundary>
            <AppProviders>
                <BrowserRouter>
                    <EventsProviderWithNavigation>
                        <Routes>
                            <Route element={<RootLayout />}>
                                <Route index element={<HomePage />} />
                                <Route
                                    path="/sessions"
                                    element={<Navigate to="/" replace />}
                                />
                                <Route
                                    path="/sessions/:id"
                                    element={<HomePage />}
                                />
                                <Route
                                    path="/settings"
                                    element={<SettingsPage />}
                                />
                                <Route
                                    path="*"
                                    element={<Navigate to="/" replace />}
                                />
                            </Route>
                        </Routes>
                    </EventsProviderWithNavigation>
                </BrowserRouter>
                <Toaster position="top-center" />
            </AppProviders>
        </ErrorBoundary>
    );
}

export default App;
