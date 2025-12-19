import { act } from "@testing-library/react";
import { useSessionStore } from "../session-store";

describe("useSessionStore", () => {
    beforeEach(() => {
        // Reset the store before each test
        act(() => {
            useSessionStore.getState().clear();
        });
    });

    describe("initial state", () => {
        it("has null sessionId and directory by default", () => {
            const state = useSessionStore.getState();
            expect(state.sessionId).toBeNull();
            expect(state.directory).toBeNull();
        });
    });

    describe("setSession", () => {
        it("sets sessionId and directory", () => {
            act(() => {
                useSessionStore
                    .getState()
                    .setSession("session-123", "/path/to/project");
            });

            const state = useSessionStore.getState();
            expect(state.sessionId).toBe("session-123");
            expect(state.directory).toBe("/path/to/project");
        });

        it("sets sessionId only when directory not provided", () => {
            act(() => {
                useSessionStore.getState().setSession("session-456");
            });

            const state = useSessionStore.getState();
            expect(state.sessionId).toBe("session-456");
            expect(state.directory).toBeNull();
        });

        it("clears session when null is passed", () => {
            act(() => {
                useSessionStore.getState().setSession("session-123", "/path");
                useSessionStore.getState().setSession(null);
            });

            const state = useSessionStore.getState();
            expect(state.sessionId).toBeNull();
            expect(state.directory).toBeNull();
        });
    });

    describe("setDirectory", () => {
        it("updates only the directory", () => {
            act(() => {
                useSessionStore
                    .getState()
                    .setSession("session-123", "/old/path");
                useSessionStore.getState().setDirectory("/new/path");
            });

            const state = useSessionStore.getState();
            expect(state.sessionId).toBe("session-123");
            expect(state.directory).toBe("/new/path");
        });

        it("can set directory to null", () => {
            act(() => {
                useSessionStore.getState().setSession("session-123", "/path");
                useSessionStore.getState().setDirectory(null);
            });

            const state = useSessionStore.getState();
            expect(state.sessionId).toBe("session-123");
            expect(state.directory).toBeNull();
        });
    });

    describe("clear", () => {
        it("resets both sessionId and directory to null", () => {
            act(() => {
                useSessionStore.getState().setSession("session-123", "/path");
                useSessionStore.getState().clear();
            });

            const state = useSessionStore.getState();
            expect(state.sessionId).toBeNull();
            expect(state.directory).toBeNull();
        });
    });
});
