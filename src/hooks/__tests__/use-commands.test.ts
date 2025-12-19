import { filterCommands, COMMANDS } from "../use-commands";

describe("COMMANDS", () => {
  it("has expected commands", () => {
    const names = COMMANDS.map((c) => c.name);
    expect(names).toContain("new");
    expect(names).toContain("undo");
    expect(names).toContain("redo");
    expect(names).toContain("review");
    expect(names).toContain("compact");
    expect(names).toContain("copy");
    expect(names).toContain("export");
    expect(names).toContain("rename");
    expect(names).toContain("mcp");
  });

  it("has required properties on each command", () => {
    COMMANDS.forEach((cmd) => {
      expect(cmd.name).toBeDefined();
      expect(cmd.label).toBeDefined();
      expect(cmd.description).toBeDefined();
      expect(cmd.icon).toBeDefined();
      expect(typeof cmd.requiresSession).toBe("boolean");
      expect(typeof cmd.showInToolbar).toBe("boolean");
    });
  });

  it("has some toolbar commands", () => {
    const toolbarCommands = COMMANDS.filter((c) => c.showInToolbar);
    expect(toolbarCommands.length).toBeGreaterThan(0);
  });

  it("has commands that require session", () => {
    const sessionCommands = COMMANDS.filter((c) => c.requiresSession);
    expect(sessionCommands.length).toBeGreaterThan(0);
    expect(sessionCommands.map((c) => c.name)).toContain("undo");
  });

  it("has commands that do not require session", () => {
    const noSessionCommands = COMMANDS.filter((c) => !c.requiresSession);
    expect(noSessionCommands.length).toBeGreaterThan(0);
    expect(noSessionCommands.map((c) => c.name)).toContain("new");
  });
});

describe("filterCommands", () => {
  it("returns all commands when query is empty", () => {
    expect(filterCommands("")).toEqual(COMMANDS);
  });

  it("filters by command name", () => {
    const result = filterCommands("new");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((c) => c.name === "new")).toBe(true);
  });

  it("filters by command label", () => {
    const result = filterCommands("Session");
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((c) => c.label.includes("Session"))).toBe(true);
  });

  it("filters by command description", () => {
    const result = filterCommands("clipboard");
    expect(result.length).toBeGreaterThan(0);
    // "copy" command has "clipboard" in description
    expect(result.some((c) => c.name === "copy")).toBe(true);
  });

  it("is case insensitive", () => {
    const lowerResult = filterCommands("undo");
    const upperResult = filterCommands("UNDO");
    const mixedResult = filterCommands("UnDo");

    expect(lowerResult).toEqual(upperResult);
    expect(lowerResult).toEqual(mixedResult);
  });

  it("returns empty array when no matches", () => {
    const result = filterCommands("xyz123nonexistent");
    expect(result).toHaveLength(0);
  });

  it("matches partial strings", () => {
    const result = filterCommands("rev"); // Should match "review"
    expect(result.some((c) => c.name === "review")).toBe(true);
  });

  it("can find commands by multiple criteria", () => {
    // "export" matches both name and "Export session" label
    const result = filterCommands("export");
    expect(result.some((c) => c.name === "export")).toBe(true);
  });
});
