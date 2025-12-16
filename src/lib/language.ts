/**
 * Map file extensions to language names for syntax highlighting
 */
export function getLanguageFromPath(filePath?: string): string {
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
