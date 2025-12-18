import { useMemo } from "react";
import { diffLines } from "diff";
import { cn } from "@/lib/utils";
import { getLanguageFromPath } from "@/lib/language";
import { HighlightedLine } from "./highlighted-line";

interface DiffViewerProps {
  oldString: string;
  newString: string;
  filePath?: string;
  className?: string;
}

export function DiffViewer({
  oldString,
  newString,
  filePath,
  className,
}: DiffViewerProps) {
  const diff = useMemo(
    () => diffLines(oldString, newString),
    [oldString, newString]
  );
  const language = useMemo(() => getLanguageFromPath(filePath), [filePath]);

  // Build side-by-side view data with proper pairing
  const rows = useMemo(() => {
    const result: Array<{
      left: {
        lineNumber: number;
        content: string;
        type: "unchanged" | "removed" | "empty";
      };
      right: {
        lineNumber: number;
        content: string;
        type: "unchanged" | "added" | "empty";
      };
    }> = [];

    let leftLineNum = 1;
    let rightLineNum = 1;

    for (const part of diff) {
      const lines = part.value.split("\n");
      // Remove last empty element if the string ends with newline
      if (lines[lines.length - 1] === "") {
        lines.pop();
      }

      if (part.added) {
        for (const line of lines) {
          result.push({
            left: { lineNumber: 0, content: "", type: "empty" },
            right: { lineNumber: rightLineNum++, content: line, type: "added" },
          });
        }
      } else if (part.removed) {
        for (const line of lines) {
          result.push({
            left: { lineNumber: leftLineNum++, content: line, type: "removed" },
            right: { lineNumber: 0, content: "", type: "empty" },
          });
        }
      } else {
        for (const line of lines) {
          result.push({
            left: {
              lineNumber: leftLineNum++,
              content: line,
              type: "unchanged",
            },
            right: {
              lineNumber: rightLineNum++,
              content: line,
              type: "unchanged",
            },
          });
        }
      }
    }

    return result;
  }, [diff]);

  return (
    <div className={cn("overflow-hidden", className)}>
      {/* Diff content */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i}>
                {/* Left side (old) */}
                <td
                  className={cn(
                    "w-10 text-right pr-2 select-none text-xs font-mono align-middle border-r border-border h-6",
                    row.left.type === "removed"
                      ? "text-red-400 bg-red-500/20"
                      : "text-muted-foreground bg-muted/50"
                  )}
                >
                  {row.left.lineNumber > 0 ? row.left.lineNumber : ""}
                </td>
                <td
                  className={cn(
                    "px-2 align-middle whitespace-pre border-r border-border h-6",
                    row.left.type === "removed" && "bg-red-500/10",
                    row.left.type === "empty" && "bg-muted/30"
                  )}
                >
                  {row.left.type === "removed" && (
                    <span className="text-red-500 mr-1">-</span>
                  )}
                  {row.left.content && (
                    <HighlightedLine
                      code={row.left.content}
                      language={language}
                    />
                  )}
                </td>

                {/* Right side (new) */}
                <td
                  className={cn(
                    "w-10 text-right pr-2 select-none text-xs font-mono align-middle border-r border-border h-6",
                    row.right.type === "added"
                      ? "text-green-400 bg-green-500/20"
                      : "text-muted-foreground bg-muted/50"
                  )}
                >
                  {row.right.lineNumber > 0 ? row.right.lineNumber : ""}
                </td>
                <td
                  className={cn(
                    "px-2 align-middle whitespace-pre h-6",
                    row.right.type === "added" && "bg-green-500/10",
                    row.right.type === "empty" && "bg-muted/30"
                  )}
                >
                  {row.right.type === "added" && (
                    <span className="text-green-500 mr-1">+</span>
                  )}
                  {row.right.content && (
                    <HighlightedLine
                      code={row.right.content}
                      language={language}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
