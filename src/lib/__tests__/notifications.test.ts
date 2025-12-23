import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { act } from "@testing-library/react";
import { useNotificationStore } from "@/stores";

// Mock sonner toast
const mockToastSuccess = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        success: (message: string, options?: unknown) =>
            mockToastSuccess(message, options)
    }
}));

// Mock the custom sounds db
vi.mock("../custom-sounds-db", () => ({
    createCustomSoundUrl: vi.fn()
}));

// Import after mocks are set up
import { sendCompletionNotification } from "../notifications";

describe("sendCompletionNotification", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Reset notification store to enabled state
        act(() => {
            const store = useNotificationStore.getState();
            store.setNotificationsEnabled(true);
            store.setBrowserNotificationsEnabled(true);
            store.setSoundEnabled(false); // Disable sound to avoid audio issues in tests
        });

        // Mock Audio to prevent actual sound playing
        vi.stubGlobal(
            "Audio",
            vi.fn().mockImplementation(() => ({
                play: vi.fn().mockResolvedValue(undefined),
                volume: 0
            }))
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    describe("when notifications are disabled", () => {
        it("should not show any notification", () => {
            act(() => {
                useNotificationStore.getState().setNotificationsEnabled(false);
            });

            sendCompletionNotification();

            expect(mockToastSuccess).not.toHaveBeenCalled();
        });
    });

    describe("when notifications are enabled", () => {
        it("should show a toast notification with default message", () => {
            sendCompletionNotification();

            expect(mockToastSuccess).toHaveBeenCalledWith(
                "Assistant has finished responding",
                expect.objectContaining({ duration: 3000 })
            );
        });

        it("should show a toast notification with custom body", () => {
            sendCompletionNotification({
                body: '"My Session" has finished responding'
            });

            expect(mockToastSuccess).toHaveBeenCalledWith(
                '"My Session" has finished responding',
                expect.objectContaining({ duration: 3000 })
            );
        });

        it("should include action with onClick handler when provided", () => {
            const mockOnClick = vi.fn();

            sendCompletionNotification({
                body: "Test message",
                onClick: mockOnClick
            });

            expect(mockToastSuccess).toHaveBeenCalledWith(
                "Test message",
                expect.objectContaining({
                    duration: 3000,
                    action: expect.objectContaining({
                        onClick: expect.any(Function)
                    })
                })
            );
        });

        it("should not include action when onClick is not provided", () => {
            sendCompletionNotification({
                body: "Test message"
            });

            expect(mockToastSuccess).toHaveBeenCalledWith("Test message", {
                duration: 3000
            });
        });

        it("should call onClick when action is triggered", () => {
            const mockOnClick = vi.fn();

            sendCompletionNotification({
                body: "Test message",
                onClick: mockOnClick
            });

            // Get the action onClick from the mock call
            const callArgs = mockToastSuccess.mock.calls[0][1] as {
                action?: { onClick: () => void };
            };
            const actionOnClick = callArgs?.action?.onClick;

            expect(actionOnClick).toBeDefined();
            actionOnClick?.();

            expect(mockOnClick).toHaveBeenCalled();
        });
    });

    describe("browser notifications", () => {
        let mockNotificationInstance: {
            onclick: ((event: Event) => void) | null;
            close: ReturnType<typeof vi.fn>;
        };
        let MockNotificationClass: {
            new (
                title: string,
                options?: NotificationOptions
            ): typeof mockNotificationInstance;
            permission: NotificationPermission;
            instances: (typeof mockNotificationInstance)[];
        };
        const originalNotification = globalThis.Notification;

        beforeEach(() => {
            mockNotificationInstance = {
                onclick: null,
                close: vi.fn()
            };

            // Create a mock Notification class
            MockNotificationClass = class MockNotification {
                onclick: ((event: Event) => void) | null = null;
                close = vi.fn();
                static permission: NotificationPermission = "granted";
                static instances: (typeof mockNotificationInstance)[] = [];

                constructor() {
                    // Store reference to this instance
                    // eslint-disable-next-line @typescript-eslint/no-this-alias
                    mockNotificationInstance = this;
                    MockNotificationClass.instances.push(this);
                }
            } as unknown as typeof MockNotificationClass;

            // Use Object.defineProperty to allow redefinition
            Object.defineProperty(globalThis, "Notification", {
                value: MockNotificationClass,
                writable: true,
                configurable: true
            });

            // Mock document.hidden to simulate background tab
            vi.spyOn(document, "hidden", "get").mockReturnValue(true);
        });

        afterEach(() => {
            // Restore original Notification
            Object.defineProperty(globalThis, "Notification", {
                value: originalNotification,
                writable: true,
                configurable: true
            });
        });

        it("should create browser notification when tab is hidden and permission granted", () => {
            sendCompletionNotification({
                title: "OpenCode",
                body: "Test notification"
            });

            // Check that a notification instance was created
            expect(MockNotificationClass.instances.length).toBe(1);
        });

        it("should set onclick handler on browser notification when onClick provided", () => {
            const mockOnClick = vi.fn();
            const mockWindowFocus = vi
                .spyOn(window, "focus")
                .mockImplementation(() => {});

            sendCompletionNotification({
                body: "Test notification",
                onClick: mockOnClick
            });

            expect(mockNotificationInstance.onclick).toBeDefined();

            // Simulate clicking the notification
            mockNotificationInstance.onclick?.(new Event("click"));

            expect(mockWindowFocus).toHaveBeenCalled();
            expect(mockOnClick).toHaveBeenCalled();
            expect(mockNotificationInstance.close).toHaveBeenCalled();

            mockWindowFocus.mockRestore();
        });

        it("should not create browser notification when tab is visible", () => {
            vi.spyOn(document, "hidden", "get").mockReturnValue(false);

            sendCompletionNotification();

            // Notification constructor should not be called
            expect(MockNotificationClass.instances.length).toBe(0);
            // But toast should still show
            expect(mockToastSuccess).toHaveBeenCalled();
        });

        it("should not create browser notification when browser notifications disabled", () => {
            act(() => {
                useNotificationStore
                    .getState()
                    .setBrowserNotificationsEnabled(false);
            });

            sendCompletionNotification();

            expect(MockNotificationClass.instances.length).toBe(0);
            // But toast should still show
            expect(mockToastSuccess).toHaveBeenCalled();
        });
    });
});
