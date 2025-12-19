import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ShikiCodeBlock } from "./shiki-code";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export const MarkdownContent = memo(function MarkdownContent({
  content,
  className,
}: MarkdownContentProps) {
  return (
    <div className={cn("prose prose-sm dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children);

            // Inline code: no language AND no newlines
            const isInline = !match && !codeString.includes("\n");

            if (isInline) {
              return (
                <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono" {...props}>
                  {children}
                </code>
              );
            }

            return (
              <ShikiCodeBlock
                code={codeString.replace(/\n$/, "")}
                language={match?.[1] || "text"}
                className="mb-6 rounded"
              />
            );
          },
          pre({ children }) {
            return <div className="overflow-x-auto">{children}</div>;
          },
          p({ children }) {
            return <p className="mb-6 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="mb-6 list-disc pl-4">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="mb-6 list-decimal pl-4">{children}</ol>;
          },
          li({ children }) {
            return <li className="mb-1">{children}</li>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
});
