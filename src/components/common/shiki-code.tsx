import { memo } from "react";
import ShikiHighlighter, { useShikiHighlighter } from "react-shiki";
import type { BundledLanguage, BundledTheme } from "shiki";
import { cn } from "@/lib/utils";
import { useThemeStore, getShikiTheme } from "@/stores";

interface ShikiCodeBlockProps {
    code: string;
    language?: string;
    className?: string;
    showLineNumbers?: boolean;
    startLine?: number;
    /** Throttle delay for real-time highlighting (ms) */
    delay?: number;
}

/**
 * Async syntax highlighter using Shiki.
 * Replaces react-syntax-highlighter (Prism) for better performance.
 * Languages are loaded on-demand.
 */
export const ShikiCodeBlock = memo(function ShikiCodeBlock({
    code,
    language,
    className,
    showLineNumbers = false,
    startLine = 1,
    delay = 0
}: ShikiCodeBlockProps) {
    // Get current theme and map to Shiki theme
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const shikiTheme = getShikiTheme(resolvedTheme);

    // Normalize language name for Shiki
    const normalizedLang = normalizeLanguage(language);

    return (
        <div
            className={cn(
                "shiki-code-block overflow-x-auto text-sm",
                className
            )}
            style={
                {
                    "--line-numbers-foreground": "rgba(107, 114, 128, 0.7)",
                    "--line-numbers-width": "3ch",
                    "--line-numbers-padding-right": "1.5ch"
                } as React.CSSProperties
            }
        >
            <ShikiHighlighter
                language={normalizedLang as BundledLanguage}
                theme={shikiTheme}
                delay={delay}
                showLineNumbers={showLineNumbers}
                startingLineNumber={startLine}
            >
                {code}
            </ShikiHighlighter>
        </div>
    );
});

interface ShikiInlineCodeProps {
    code: string;
    language?: string;
    className?: string;
}

/**
 * Inline code highlighter using Shiki.
 * For single-line syntax highlighting (e.g., in diffs).
 */
export const ShikiInlineCode = memo(function ShikiInlineCode({
    code,
    language,
    className
}: ShikiInlineCodeProps) {
    // Get current theme and map to Shiki theme
    const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
    const shikiTheme = getShikiTheme(resolvedTheme);

    const normalizedLang = normalizeLanguage(language);

    // Use the hook for more control over inline rendering
    const highlighted = useShikiHighlighter(
        code || " ",
        normalizedLang as BundledLanguage,
        shikiTheme
    );

    return (
        <span className={cn("shiki-inline font-mono text-xs", className)}>
            {highlighted}
        </span>
    );
});

/**
 * Normalize language names to Shiki-compatible identifiers.
 * Shiki uses different language names than Prism in some cases.
 */
function normalizeLanguage(language?: string): string {
    if (!language) return "text";

    const langMap: Record<string, string> = {
        // Common aliases
        js: "javascript",
        ts: "typescript",
        jsx: "jsx",
        tsx: "tsx",
        py: "python",
        rb: "ruby",
        yml: "yaml",
        md: "markdown",
        sh: "bash",
        shell: "bash",
        zsh: "bash",
        // File extension mappings
        mjs: "javascript",
        cjs: "javascript",
        mts: "typescript",
        cts: "typescript"
    };

    const lower = language.toLowerCase();
    return langMap[lower] || lower;
}

// Re-export types for consumers
export type { BundledLanguage, BundledTheme };
