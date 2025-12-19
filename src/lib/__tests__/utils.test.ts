import { cn } from "../utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    const isIncluded = true;
    const isExcluded = false;
    expect(cn("base", isIncluded && "included", isExcluded && "excluded")).toBe("base included");
  });

  it("handles undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("merges Tailwind classes correctly", () => {
    // tw-merge should dedupe conflicting utilities
    expect(cn("px-2", "px-4")).toBe("px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("handles arrays of classes", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("handles objects with boolean values", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("handles complex Tailwind merging", () => {
    // Should keep responsive variants separate
    expect(cn("p-4 md:p-6", "p-2")).toBe("md:p-6 p-2");
    // Should merge background colors
    expect(cn("bg-red-500 hover:bg-red-600", "bg-blue-500")).toBe("hover:bg-red-600 bg-blue-500");
  });
});
