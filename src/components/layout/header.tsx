import { Moon, Sun, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "@/providers";
import { THEMES, type Theme } from "@/stores";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

// Theme color swatches for visual identification
const THEME_COLORS: Record<Theme, { bg: string; accent: string }> = {
  light: { bg: "#ffffff", accent: "#7c3aed" },
  dark: { bg: "#1a1a1a", accent: "#a78bfa" },
  system: { bg: "linear-gradient(135deg, #ffffff 50%, #1a1a1a 50%)", accent: "#7c3aed" },
  "catppuccin-latte": { bg: "#eff1f5", accent: "#8839ef" },
  "catppuccin-mocha": { bg: "#1e1e2e", accent: "#cba6f7" },
  dracula: { bg: "#282a36", accent: "#bd93f9" },
  monokai: { bg: "#272822", accent: "#a6e22e" },
  nord: { bg: "#2e3440", accent: "#88c0d0" },
  "one-dark": { bg: "#282c34", accent: "#61afef" },
  "synthwave-84": { bg: "#262335", accent: "#ff7edb" },
  "tokyo-night": { bg: "#1a1b26", accent: "#7aa2f7" },
};

function ThemeSwatch({ themeValue }: { themeValue: Theme }) {
  const colors = THEME_COLORS[themeValue];
  const isGradient = colors.bg.startsWith("linear-gradient");
  
  return (
    <span 
      className="h-4 w-4 rounded-full border border-border shrink-0"
      style={{ 
        background: isGradient ? colors.bg : colors.bg,
        boxShadow: `inset 0 0 0 2px ${colors.accent}`,
      }}
    />
  );
}

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
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {leftContent}
          <Logo className="h-6 w-6 shrink-0" />
          <h1 className="text-lg font-semibold shrink-0">{title || "OpenCode Hana"}</h1>
          {sessionTitle && (
            <>
              <span className="text-muted-foreground shrink-0">/</span>
              <span className="text-sm text-muted-foreground truncate">{sessionTitle}</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {children}
          <Tooltip>
            <TooltipTrigger
              render={
                <Link
                  to="/settings"
                  className="hidden md:inline-flex items-center justify-center h-9 w-9 rounded-none hover:bg-muted hover:text-foreground transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">Settings</span>
                </Link>
              }
            />
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger
                render={
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
                }
              />
              <TooltipContent>Toggle theme</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                  {THEMES.slice(0, 3).map((t) => (
                    <DropdownMenuRadioItem key={t.value} value={t.value}>
                      <ThemeSwatch themeValue={t.value} />
                      <span className="ml-2">{t.label}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Custom Themes</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
                  {THEMES.slice(3).map((t) => (
                    <DropdownMenuRadioItem key={t.value} value={t.value}>
                      <ThemeSwatch themeValue={t.value} />
                      <span className="ml-2">{t.label}</span>
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
