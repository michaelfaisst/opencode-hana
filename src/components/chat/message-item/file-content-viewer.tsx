import { useMemo, memo } from "react";
import { ShikiCodeBlock } from "@/components/common/shiki-code";
import { getLanguageFromPath } from "@/lib/language";
import { cn } from "@/lib/utils";

interface FileContentViewerProps {
  content: string;
  filePath?: string;
  startLine?: number;
  maxHeight?: string;
  className?: string;
  /** Force syntax highlighting even if content doesn't have <file> tags */
  forceHighlight?: boolean;
}

/**
 * Parses file content from read tool output format.
 * The format is typically:
 * <file>
 * 00001| line content
 * 00002| line content
 * </file>
 *
 * (End of file - total X lines)
 *
 * Or sometimes just plain content without wrappers.
 *
 * Returns isFileContent: true if the content appears to be file content
 * (has <file> tags or line numbers), false otherwise.
 */
function parseFileContent(content: string): {
  lines: string[];
  startLine: number;
  isFileContent: boolean;
} {
  let rawContent = content;
  let hasFileTags = false;
  let hasLineNumbers = false;

  // Check and remove <file> opening tag if present
  if (rawContent.includes("<file>")) {
    hasFileTags = true;
    rawContent = rawContent.replace(/^[\s\S]*?<file>\n?/, "");
  }

  // Remove </file> closing tag and anything after (like "End of file" message)
  if (rawContent.includes("</file>")) {
    hasFileTags = true;
    rawContent = rawContent.replace(/\n?<\/file>[\s\S]*$/, "");
  }

  // Also handle (End of file...) message that might appear without </file>
  rawContent = rawContent.replace(/\n?\(End of file[^)]*\)\s*$/, "");

  // Split into lines
  const lines = rawContent.split("\n");

  // Check for line number format: "00001| content" (5 digits + pipe + optional space)
  const lineNumberPattern = /^(\d{5})\|\s?(.*)$/;

  let startLine = 1;
  const parsedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(lineNumberPattern);

    if (match) {
      hasLineNumbers = true;
      if (parsedLines.length === 0) {
        // First line with a number determines the start line
        startLine = parseInt(match[1], 10);
      }
      parsedLines.push(match[2]);
    } else if (!hasLineNumbers) {
      // If we haven't seen line numbers yet, treat as plain content
      parsedLines.push(line);
    } else {
      // After seeing line numbers, this might be an empty line or content without number
      // Try to preserve it
      parsedLines.push(line);
    }
  }

  return {
    lines: parsedLines,
    startLine: hasLineNumbers ? startLine : 1,
    isFileContent: hasFileTags || hasLineNumbers,
  };
}

export const FileContentViewer = memo(function FileContentViewer({
  content,
  filePath,
  startLine: propStartLine,
  maxHeight = "400px",
  className,
  forceHighlight = false,
}: FileContentViewerProps) {
  const {
    lines,
    startLine: parsedStartLine,
    isFileContent,
  } = useMemo(() => parseFileContent(content), [content]);

  const language = useMemo(() => getLanguageFromPath(filePath), [filePath]);

  const effectiveStartLine = propStartLine ?? parsedStartLine;
  const codeContent = isFileContent ? lines.join("\n") : content;

  // If it's not file content and not forced, show plain text
  if (!isFileContent && !forceHighlight) {
    return (
      <div className={cn("overflow-auto", className)} style={{ maxHeight }}>
        <pre className="p-3 text-xs font-mono bg-background whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div
      className={cn("overflow-auto bg-[#24292e] rounded-b", className)}
      style={{ maxHeight }}
    >
      <ShikiCodeBlock
        code={codeContent}
        language={language}
        showLineNumbers
        startLine={effectiveStartLine}
        className="p-3 text-xs"
      />
    </div>
  );
});
