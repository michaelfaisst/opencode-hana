import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Bot, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: typeof MessageSquare;
  matchPattern?: RegExp;
}

const navItems: NavItem[] = [
  {
    label: "Sessions",
    href: "/sessions",
    icon: MessageSquare,
    matchPattern: /^\/sessions$/,
  },
  {
    label: "Chat",
    href: "/sessions/current",
    icon: Bot,
    matchPattern: /^\/sessions\/.+$/,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = item.matchPattern
            ? item.matchPattern.test(location.pathname)
            : location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
