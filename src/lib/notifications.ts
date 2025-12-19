import { toast } from "sonner";
import { useNotificationStore, type NotificationSound } from "@/stores";

/**
 * Safely check if Notification API is available
 * On iOS Safari, accessing Notification throws a ReferenceError
 */
function isNotificationSupported(): boolean {
    try {
        return typeof window !== "undefined" && "Notification" in window;
    } catch {
        return false;
    }
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isNotificationSupported()) {
        return "denied";
    }

    if (Notification.permission === "granted") {
        return "granted";
    }

    if (Notification.permission === "denied") {
        return "denied";
    }

    const permission = await Notification.requestPermission();
    useNotificationStore.getState().setBrowserPermission(permission);
    return permission;
}

/**
 * Get current browser notification permission
 */
export function getBrowserNotificationPermission(): NotificationPermission {
    if (!isNotificationSupported()) {
        return "denied";
    }
    return Notification.permission;
}

/**
 * Play a notification sound using MP3 files
 */
export function playNotificationSound(sound: NotificationSound): void {
    const audio = new Audio(`/sounds/${sound}.mp3`);
    audio.volume = 0.5;
    audio.play().catch((err) => {
        console.warn("Could not play notification sound:", err);
    });
}

/**
 * Preview a notification sound (for settings)
 */
export function previewSound(sound: NotificationSound): void {
    playNotificationSound(sound);
}

interface CompletionNotificationOptions {
    title?: string;
    body?: string;
}

/**
 * Send a completion notification
 * - Shows browser notification if enabled and permission granted
 * - Shows sonner toast
 * - Plays sound if enabled
 */
export function sendCompletionNotification(
    options: CompletionNotificationOptions = {}
): void {
    const { title = "OpenCode", body = "Assistant has finished responding" } =
        options;

    const state = useNotificationStore.getState();

    // Check if notifications are enabled at all
    if (!state.notificationsEnabled) {
        return;
    }

    // Try browser notification if enabled
    if (
        isNotificationSupported() &&
        state.browserNotificationsEnabled &&
        Notification.permission === "granted"
    ) {
        // Only show browser notification if tab is not focused
        if (document.hidden) {
            try {
                new Notification(title, {
                    body,
                    icon: "/logo.svg",
                    tag: "opencode-completion" // Prevents duplicate notifications
                });
            } catch (err) {
                console.warn("Could not show browser notification:", err);
            }
        }
    }

    // Always show toast (when notifications are enabled)
    toast.success(body, {
        duration: 3000
    });

    // Play sound if enabled
    if (state.soundEnabled) {
        playNotificationSound(state.selectedSound);
    }
}

/**
 * Check if we should show the permission request button
 */
export function shouldShowPermissionRequest(): boolean {
    if (!isNotificationSupported()) {
        return false;
    }
    return Notification.permission === "default";
}
