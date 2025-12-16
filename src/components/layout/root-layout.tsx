import { Outlet } from "react-router-dom";
import { MobileNav } from "./mobile-nav";

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pb-16 md:pb-0">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
