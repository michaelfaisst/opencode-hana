import { useMemo } from "react";
import { diffLines } from "diff";
import { cn } from "@/lib/utils";
import { getLanguageFromPath } from "@/lib/language";
import { HighlightedLine } from "./highlighted-line";

interface UnifiedDiffViewerProps {
  oldString: string;
  newString: string;
  filePath?: string;
  className?: string;
}

export function UnifiedDiffViewer({
  oldString,
  newString,
  filePath,
  className,
}: UnifiedDiffViewerProps) {
  const diff = useMemo(
    () => diffLines(oldString, newString),
    [oldString, newString]
  );
  const language = useMemo(() => getLanguageFromPath(filePath), [filePath]);

  return (
    <div className={cn("overflow-hidden", className)}>
      {/* Diff content */}
      <div className="overflow-x-auto">
        {diff.map((part, i) => {
          const lines = part.value.split("\n");
          if (lines[lines.length - 1] === "") lines.pop();

          return lines.map((line, j) => (
            <div
              key={`${i}-${j}`}
              className={cn(
                "flex text-xs font-mono h-6 items-center",
                part.added && "bg-green-500/10",
                part.removed && "bg-red-500/10"
              )}
            >
              <span
                className={cn(
                  "w-6 shrink-0 text-center select-none",
                  part.added && "text-green-500",
                  part.removed && "text-red-500",
                  !part.added && !part.removed && "text-muted-foreground"
                )}
              >
                {part.added ? "+" : part.removed ? "-" : " "}
              </span>
              <span className="flex-1 px-2 whitespace-pre">
                <HighlightedLine code={line} language={language} />
              </span>
            </div>
          ));
        })}
      </div>
    </div>
  );
}
