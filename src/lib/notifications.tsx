import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import {
    useNotificationStore,
    isCustomSound,
    getCustomSoundId,
    type NotificationSound
} from "@/stores";
import { createCustomSoundUrl } from "./custom-sounds-db";

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
 * Supports both preset sounds and custom sounds from IndexedDB
 */
export async function playNotificationSound(
    sound: NotificationSound
): Promise<void> {
    try {
        // Handle custom sounds (stored in IndexedDB)
        if (isCustomSound(sound)) {
            const customId = getCustomSoundId(sound);
            const blobUrl = await createCustomSoundUrl(customId);

            if (!blobUrl) {
                console.warn("Custom sound not found:", customId);
                return;
            }

            const audio = new Audio(blobUrl);
            audio.volume = 0.5;

            // Revoke URL after playback to prevent memory leaks
            audio.onended = () => URL.revokeObjectURL(blobUrl);
            audio.onerror = () => URL.revokeObjectURL(blobUrl);

            await audio.play();
            return;
        }

        // Handle preset sounds (static files)
        const audio = new Audio(`/sounds/${sound}.mp3`);
        audio.volume = 0.5;
        await audio.play();
    } catch (err) {
        console.warn("Could not play notification sound:", err);
    }
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
    onClick?: () => void;
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
    const {
        title = "OpenCode",
        body = "Assistant has finished responding",
        onClick
    } = options;

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
                const notification = new Notification(title, {
                    body,
                    icon: "/logo.svg",
                    tag: "opencode-completion" // Prevents duplicate notifications
                });

                // Add click handler to focus window and navigate
                if (onClick) {
                    notification.onclick = () => {
                        window.focus();
                        onClick();
                        notification.close();
                    };
                }
            } catch (err) {
                console.warn("Could not show browser notification:", err);
            }
        }
    }

    // Always show toast (when notifications are enabled)
    // Add click action to navigate to the session
    if (onClick) {
        toast.success(body, {
            duration: 3000,
            action: {
                label: <ArrowRight className="h-4 w-4" />,
                onClick: () => onClick()
            }
        });
    } else {
        toast.success(body, {
            duration: 3000
        });
    }

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
