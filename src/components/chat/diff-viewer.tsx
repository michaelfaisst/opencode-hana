import { useMemo } from "react";
import { diffLines } from "diff";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";

interface DiffViewerProps {
  oldString: string;
  newString: string;
  filePath?: string;
  className?: string;
}

// Map file extensions to language names for syntax highlighting
function getLanguageFromPath(filePath?: string): string {
  if (!filePath) return "text";
  
  const ext = filePath.split(".").pop()?.toLowerCase();
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    js: "javascript",
    jsx: "jsx",
    ts: "typescript",
    tsx: "tsx",
    mjs: "javascript",
    cjs: "javascript",
    // Web
    html: "html",
    htm: "html",
    css: "css",
    scss: "scss",
    sass: "sass",
    less: "less",
    // Data formats
    json: "json",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    toml: "toml",
    // Programming languages
    py: "python",
    rb: "ruby",
    go: "go",
    rs: "rust",
    java: "java",
    kt: "kotlin",
    swift: "swift",
    c: "c",
    cpp: "cpp",
    h: "c",
    hpp: "cpp",
    cs: "csharp",
    php: "php",
    // Shell/Config
    sh: "bash",
    bash: "bash",
    zsh: "bash",
    fish: "bash",
    ps1: "powershell",
    // Markup/Docs
    md: "markdown",
    mdx: "markdown",
    // Other
    sql: "sql",
    graphql: "graphql",
    gql: "graphql",
    dockerfile: "docker",
    makefile: "makefile",
    vue: "vue",
    svelte: "svelte",
  };
  
  return languageMap[ext || ""] || "text";
}

// Custom inline syntax highlighter for a single line
function HighlightedLine({ code, language }: { code: string; language: string }) {
  return (
    <SyntaxHighlighter
      style={oneDark}
      language={language}
      PreTag="span"
      CodeTag="span"
      customStyle={{
        display: "inline",
        padding: 0,
        margin: 0,
        background: "transparent",
        fontSize: "0.75rem",
      }}
      codeTagProps={{
        style: {
          display: "inline",
          background: "transparent",
        }
      }}
    >
      {code || " "}
    </SyntaxHighlighter>
  );
}

export function DiffViewer({ oldString, newString, filePath, className }: DiffViewerProps) {
  const diff = useMemo(() => diffLines(oldString, newString), [oldString, newString]);
  const language = useMemo(() => getLanguageFromPath(filePath), [filePath]);
  
  // Build side-by-side view data with proper pairing
  const rows = useMemo(() => {
    const result: Array<{
      left: { lineNumber: number; content: string; type: "unchanged" | "removed" | "empty" };
      right: { lineNumber: number; content: string; type: "unchanged" | "added" | "empty" };
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
            left: { lineNumber: leftLineNum++, content: line, type: "unchanged" },
            right: { lineNumber: rightLineNum++, content: line, type: "unchanged" },
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
              <tr key={i} className="border-t border-border first:border-t-0">
                {/* Left side (old) */}
                <td className={cn(
                  "w-10 text-right pr-2 select-none text-xs font-mono align-middle border-r border-border h-6",
                  row.left.type === "removed" ? "text-red-400 bg-red-500/20" : "text-muted-foreground bg-muted/50"
                )}>
                  {row.left.lineNumber > 0 ? row.left.lineNumber : ""}
                </td>
                <td className={cn(
                  "px-2 align-middle whitespace-pre border-r border-border h-6",
                  row.left.type === "removed" && "bg-red-500/10",
                  row.left.type === "empty" && "bg-muted/30"
                )}>
                  {row.left.type === "removed" && <span className="text-red-500 mr-1">-</span>}
                  {row.left.content && (
                    <HighlightedLine code={row.left.content} language={language} />
                  )}
                </td>
                
                {/* Right side (new) */}
                <td className={cn(
                  "w-10 text-right pr-2 select-none text-xs font-mono align-middle border-r border-border h-6",
                  row.right.type === "added" ? "text-green-400 bg-green-500/20" : "text-muted-foreground bg-muted/50"
                )}>
                  {row.right.lineNumber > 0 ? row.right.lineNumber : ""}
                </td>
                <td className={cn(
                  "px-2 align-middle whitespace-pre h-6",
                  row.right.type === "added" && "bg-green-500/10",
                  row.right.type === "empty" && "bg-muted/30"
                )}>
                  {row.right.type === "added" && <span className="text-green-500 mr-1">+</span>}
                  {row.right.content && (
                    <HighlightedLine code={row.right.content} language={language} />
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

// Unified diff view (alternative, more compact)
export function UnifiedDiffViewer({ oldString, newString, filePath, className }: DiffViewerProps) {
  const diff = useMemo(() => diffLines(oldString, newString), [oldString, newString]);
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
              <span className={cn(
                "w-6 shrink-0 text-center select-none",
                part.added && "text-green-500",
                part.removed && "text-red-500",
                !part.added && !part.removed && "text-muted-foreground"
              )}>
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
