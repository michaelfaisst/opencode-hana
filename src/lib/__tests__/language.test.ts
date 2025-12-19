import { getLanguageFromPath } from "../language";

describe("getLanguageFromPath", () => {
  describe("JavaScript/TypeScript", () => {
    it("returns javascript for .js files", () => {
      expect(getLanguageFromPath("app.js")).toBe("javascript");
      expect(getLanguageFromPath("/path/to/file.js")).toBe("javascript");
    });

    it("returns jsx for .jsx files", () => {
      expect(getLanguageFromPath("Component.jsx")).toBe("jsx");
    });

    it("returns typescript for .ts files", () => {
      expect(getLanguageFromPath("types.ts")).toBe("typescript");
    });

    it("returns tsx for .tsx files", () => {
      expect(getLanguageFromPath("Component.tsx")).toBe("tsx");
    });

    it("returns javascript for .mjs and .cjs files", () => {
      expect(getLanguageFromPath("module.mjs")).toBe("javascript");
      expect(getLanguageFromPath("config.cjs")).toBe("javascript");
    });
  });

  describe("Web languages", () => {
    it("returns html for .html and .htm files", () => {
      expect(getLanguageFromPath("index.html")).toBe("html");
      expect(getLanguageFromPath("page.htm")).toBe("html");
    });

    it("returns css for .css files", () => {
      expect(getLanguageFromPath("styles.css")).toBe("css");
    });

    it("returns scss for .scss files", () => {
      expect(getLanguageFromPath("styles.scss")).toBe("scss");
    });

    it("returns sass for .sass files", () => {
      expect(getLanguageFromPath("styles.sass")).toBe("sass");
    });

    it("returns less for .less files", () => {
      expect(getLanguageFromPath("styles.less")).toBe("less");
    });
  });

  describe("Data formats", () => {
    it("returns json for .json files", () => {
      expect(getLanguageFromPath("package.json")).toBe("json");
    });

    it("returns yaml for .yaml and .yml files", () => {
      expect(getLanguageFromPath("config.yaml")).toBe("yaml");
      expect(getLanguageFromPath("config.yml")).toBe("yaml");
    });

    it("returns xml for .xml files", () => {
      expect(getLanguageFromPath("data.xml")).toBe("xml");
    });

    it("returns toml for .toml files", () => {
      expect(getLanguageFromPath("Cargo.toml")).toBe("toml");
    });
  });

  describe("Programming languages", () => {
    it("returns python for .py files", () => {
      expect(getLanguageFromPath("script.py")).toBe("python");
    });

    it("returns ruby for .rb files", () => {
      expect(getLanguageFromPath("script.rb")).toBe("ruby");
    });

    it("returns go for .go files", () => {
      expect(getLanguageFromPath("main.go")).toBe("go");
    });

    it("returns rust for .rs files", () => {
      expect(getLanguageFromPath("main.rs")).toBe("rust");
    });

    it("returns java for .java files", () => {
      expect(getLanguageFromPath("Main.java")).toBe("java");
    });

    it("returns kotlin for .kt files", () => {
      expect(getLanguageFromPath("Main.kt")).toBe("kotlin");
    });

    it("returns swift for .swift files", () => {
      expect(getLanguageFromPath("Main.swift")).toBe("swift");
    });

    it("returns c for .c and .h files", () => {
      expect(getLanguageFromPath("main.c")).toBe("c");
      expect(getLanguageFromPath("header.h")).toBe("c");
    });

    it("returns cpp for .cpp and .hpp files", () => {
      expect(getLanguageFromPath("main.cpp")).toBe("cpp");
      expect(getLanguageFromPath("header.hpp")).toBe("cpp");
    });

    it("returns csharp for .cs files", () => {
      expect(getLanguageFromPath("Program.cs")).toBe("csharp");
    });

    it("returns php for .php files", () => {
      expect(getLanguageFromPath("index.php")).toBe("php");
    });
  });

  describe("Shell/Config", () => {
    it("returns bash for shell scripts", () => {
      expect(getLanguageFromPath("script.sh")).toBe("bash");
      expect(getLanguageFromPath("script.bash")).toBe("bash");
      expect(getLanguageFromPath("script.zsh")).toBe("bash");
      expect(getLanguageFromPath("config.fish")).toBe("bash");
    });

    it("returns powershell for .ps1 files", () => {
      expect(getLanguageFromPath("script.ps1")).toBe("powershell");
    });
  });

  describe("Markup/Docs", () => {
    it("returns markdown for .md and .mdx files", () => {
      expect(getLanguageFromPath("README.md")).toBe("markdown");
      expect(getLanguageFromPath("page.mdx")).toBe("markdown");
    });
  });

  describe("Other formats", () => {
    it("returns sql for .sql files", () => {
      expect(getLanguageFromPath("query.sql")).toBe("sql");
    });

    it("returns graphql for .graphql and .gql files", () => {
      expect(getLanguageFromPath("schema.graphql")).toBe("graphql");
      expect(getLanguageFromPath("query.gql")).toBe("graphql");
    });

    it("returns docker for dockerfile", () => {
      expect(getLanguageFromPath("Dockerfile")).toBe("docker");
    });

    it("returns vue for .vue files", () => {
      expect(getLanguageFromPath("Component.vue")).toBe("vue");
    });

    it("returns svelte for .svelte files", () => {
      expect(getLanguageFromPath("Component.svelte")).toBe("svelte");
    });
  });

  describe("Edge cases", () => {
    it("returns text for undefined path", () => {
      expect(getLanguageFromPath(undefined)).toBe("text");
    });

    it("returns text for empty string", () => {
      expect(getLanguageFromPath("")).toBe("text");
    });

    it("returns text for unknown extensions", () => {
      expect(getLanguageFromPath("file.xyz")).toBe("text");
      expect(getLanguageFromPath("file.unknown")).toBe("text");
    });

    it("handles uppercase extensions", () => {
      expect(getLanguageFromPath("file.JS")).toBe("javascript");
      expect(getLanguageFromPath("file.TSX")).toBe("tsx");
    });

    it("handles files with multiple dots", () => {
      expect(getLanguageFromPath("file.test.ts")).toBe("typescript");
      expect(getLanguageFromPath("app.config.json")).toBe("json");
    });

    it("handles hidden files with extensions", () => {
      expect(getLanguageFromPath(".eslintrc.json")).toBe("json");
      expect(getLanguageFromPath(".prettierrc.yaml")).toBe("yaml");
    });
  });
});
