import { Outlet } from "react-router-dom";

export function RootLayout() {
    return (
        <div className="flex h-dvh flex-col bg-background overflow-hidden">
            <main className="flex-1 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
