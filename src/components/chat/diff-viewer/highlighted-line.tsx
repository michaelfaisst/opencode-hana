import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";

interface HighlightedLineProps {
  code: string;
  language: string;
}

export function HighlightedLine({ code, language }: HighlightedLineProps) {
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
        },
      }}
    >
      {code || " "}
    </SyntaxHighlighter>
  );
}
