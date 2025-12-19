import { memo } from "react";
import { ShikiInlineCode } from "@/components/common/shiki-code";

interface HighlightedLineProps {
    code: string;
    language: string;
}

/**
 * Inline syntax highlighting for a single line of code.
 * Used in diff viewers where each line needs individual highlighting.
 * Memoized to prevent unnecessary re-renders.
 */
export const HighlightedLine = memo(function HighlightedLine({
    code,
    language
}: HighlightedLineProps) {
    return <ShikiInlineCode code={code || " "} language={language} />;
});
