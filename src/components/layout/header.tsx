import { Moon, Sun, Monitor, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/providers";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function Logo({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      className={className}
    >
      <g className="fill-pink-500 dark:fill-pink-400">
        {/* Petals at 0°, 72°, 144°, 216°, 288° */}
        <path d="M50 10 C42 26, 42 40, 50 48 C58 40, 58 26, 50 10 Z" />
        <path d="M50 10 C42 26, 42 40, 50 48 C58 40, 58 26, 50 10 Z" transform="rotate(72 50 50)" />
        <path d="M50 10 C42 26, 42 40, 50 48 C58 40, 58 26, 50 10 Z" transform="rotate(144 50 50)" />
        <path d="M50 10 C42 26, 42 40, 50 48 C58 40, 58 26, 50 10 Z" transform="rotate(216 50 50)" />
        <path d="M50 10 C42 26, 42 40, 50 48 C58 40, 58 26, 50 10 Z" transform="rotate(288 50 50)" />
        {/* Center */}
        <circle cx="50" cy="50" r="6" />
      </g>
    </svg>
  );
}

interface HeaderProps {
  title?: string;
  sessionTitle?: string;
  children?: React.ReactNode;
  leftContent?: React.ReactNode;
}

export function Header({ title, sessionTitle, children, leftContent }: HeaderProps) {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {leftContent}
          <Logo className="h-6 w-6" />
          <h1 className="text-lg font-semibold">{title || "OpenCode Hana"}</h1>
          {sessionTitle && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-muted-foreground truncate max-w-48">{sessionTitle}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
          <Link
            to="/settings"
            className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-none hover:bg-muted hover:text-foreground transition-colors"
          >
            <Settings className="h-4 w-4" />
            <span className="sr-only">Settings</span>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {resolvedTheme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              }
            />
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
