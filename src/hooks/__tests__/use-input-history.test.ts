import { renderHook, act } from "@testing-library/react";
import { useInputHistory } from "../use-input-history";

describe("useInputHistory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("initial state", () => {
    it("starts with empty history", () => {
      const { result } = renderHook(() => useInputHistory());
      expect(result.current.historyLength).toBe(0);
      expect(result.current.isNavigating).toBe(false);
    });

    it("loads history from localStorage", () => {
      localStorage.setItem("opencode-input-history", JSON.stringify(["message 1", "message 2"]));

      const { result } = renderHook(() => useInputHistory());
      expect(result.current.historyLength).toBe(2);
    });

    it("handles invalid localStorage data gracefully", () => {
      localStorage.setItem("opencode-input-history", "not-valid-json");

      const { result } = renderHook(() => useInputHistory());
      expect(result.current.historyLength).toBe(0);
    });

    it("handles non-array localStorage data gracefully", () => {
      localStorage.setItem("opencode-input-history", JSON.stringify({ foo: "bar" }));

      const { result } = renderHook(() => useInputHistory());
      expect(result.current.historyLength).toBe(0);
    });
  });

  describe("addToHistory", () => {
    it("adds a message to history", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("Hello world");
      });

      expect(result.current.historyLength).toBe(1);
    });

    it("trims whitespace from messages", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("  Hello world  ");
      });

      expect(result.current.historyLength).toBe(1);

      // Navigate up to verify the trimmed message
      let message: string | undefined;
      act(() => {
        message = result.current.navigateUp("");
      });

      expect(message).toBe("Hello world");
    });

    it("ignores empty messages", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("");
        result.current.addToHistory("   ");
      });

      expect(result.current.historyLength).toBe(0);
    });

    it("removes duplicates and moves to front", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("first");
        result.current.addToHistory("second");
        result.current.addToHistory("first"); // Duplicate
      });

      expect(result.current.historyLength).toBe(2);

      // Most recent should be "first"
      let message: string | undefined;
      act(() => {
        message = result.current.navigateUp("");
      });
      expect(message).toBe("first");
    });

    it("persists history to localStorage", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("test message");
      });

      const stored = JSON.parse(localStorage.getItem("opencode-input-history") || "[]");
      expect(stored).toContain("test message");
    });

    it("respects maxSize option", () => {
      const { result } = renderHook(() => useInputHistory({ maxSize: 3 }));

      act(() => {
        result.current.addToHistory("one");
        result.current.addToHistory("two");
        result.current.addToHistory("three");
        result.current.addToHistory("four");
      });

      expect(result.current.historyLength).toBe(3);
    });
  });

  describe("navigation", () => {
    it("navigateUp returns previous messages", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("first");
        result.current.addToHistory("second");
        result.current.addToHistory("third");
      });

      let message: string | undefined;

      // Navigate up through history (newest to oldest)
      act(() => {
        message = result.current.navigateUp("current draft");
      });
      expect(message).toBe("third");
      expect(result.current.isNavigating).toBe(true);

      act(() => {
        message = result.current.navigateUp("");
      });
      expect(message).toBe("second");

      act(() => {
        message = result.current.navigateUp("");
      });
      expect(message).toBe("first");

      // At oldest, returns undefined
      act(() => {
        message = result.current.navigateUp("");
      });
      expect(message).toBeUndefined();
    });

    it("navigateDown returns to newer messages and draft", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("first");
        result.current.addToHistory("second");
      });

      // Navigate up twice
      act(() => {
        result.current.navigateUp("my draft");
        result.current.navigateUp("");
      });

      let message: string | undefined;

      // Navigate down
      act(() => {
        message = result.current.navigateDown();
      });
      expect(message).toBe("second");

      // Navigate down to draft
      act(() => {
        message = result.current.navigateDown();
      });
      expect(message).toBe("my draft");
      expect(result.current.isNavigating).toBe(false);
    });

    it("navigateDown returns undefined when not navigating", () => {
      const { result } = renderHook(() => useInputHistory());

      let message: string | undefined;
      act(() => {
        message = result.current.navigateDown();
      });

      expect(message).toBeUndefined();
    });

    it("navigateUp returns undefined with empty history", () => {
      const { result } = renderHook(() => useInputHistory());

      let message: string | undefined;
      act(() => {
        message = result.current.navigateUp("draft");
      });

      expect(message).toBeUndefined();
      expect(result.current.isNavigating).toBe(false);
    });

    it("resetNavigation clears navigation state", () => {
      const { result } = renderHook(() => useInputHistory());

      act(() => {
        result.current.addToHistory("first");
        result.current.addToHistory("second");
      });

      // Navigate up to start navigating
      act(() => {
        result.current.navigateUp("");
      });

      expect(result.current.isNavigating).toBe(true);

      act(() => {
        result.current.resetNavigation();
      });

      expect(result.current.isNavigating).toBe(false);
    });
  });
});
