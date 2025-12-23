import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
    getAllCustomSoundsMeta,
    saveCustomSound as saveCustomSoundToDB,
    deleteCustomSound as deleteCustomSoundFromDB,
    type CustomSoundMeta,
    type AllowedAudioType
} from "@/lib/custom-sounds-db";

/**
 * Preset notification sound IDs
 */
export type PresetNotificationSound =
    | "notification-1"
    | "notification-2"
    | "notification-3"
    | "notification-4";

/**
 * Custom notification sound ID format: "custom:uuid"
 */
export type CustomNotificationSound = `custom:${string}`;

/**
 * All notification sound types (preset or custom)
 */
export type NotificationSound =
    | PresetNotificationSound
    | CustomNotificationSound;

export interface NotificationSoundOption {
    id: NotificationSound;
    label: string;
}

export const PRESET_NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
    { id: "notification-1", label: "Notification 1" },
    { id: "notification-2", label: "Notification 2" },
    { id: "notification-3", label: "Notification 3" },
    { id: "notification-4", label: "Notification 4" }
];

/**
 * @deprecated Use PRESET_NOTIFICATION_SOUNDS instead
 */
export const NOTIFICATION_SOUNDS = PRESET_NOTIFICATION_SOUNDS;

/**
 * Check if a sound ID is a custom sound
 */
export function isCustomSound(
    sound: NotificationSound
): sound is CustomNotificationSound {
    return sound.startsWith("custom:");
}

/**
 * Extract the UUID from a custom sound ID
 */
export function getCustomSoundId(sound: CustomNotificationSound): string {
    return sound.replace("custom:", "");
}

/**
 * Safely get the initial browser permission
 * On iOS Safari, accessing Notification throws a ReferenceError
 */
function getInitialBrowserPermission(): NotificationPermission {
    try {
        if (typeof window !== "undefined" && "Notification" in window) {
            return Notification.permission;
        }
    } catch {
        // Notification API not available (e.g., iOS Safari)
    }
    return "denied";
}

interface NotificationStore {
    // Settings (persisted)
    notificationsEnabled: boolean;
    browserNotificationsEnabled: boolean;
    soundEnabled: boolean;
    selectedSound: NotificationSound;

    // Runtime state (not persisted)
    browserPermission: NotificationPermission;
    customSounds: CustomSoundMeta[];
    customSoundsLoaded: boolean;
    customSoundsLoading: boolean;

    // Actions
    setNotificationsEnabled: (enabled: boolean) => void;
    setBrowserNotificationsEnabled: (enabled: boolean) => void;
    setSoundEnabled: (enabled: boolean) => void;
    setSelectedSound: (sound: NotificationSound) => void;
    setBrowserPermission: (permission: NotificationPermission) => void;

    // Custom sounds actions
    loadCustomSounds: () => Promise<void>;
    addCustomSound: (
        name: string,
        blob: Blob,
        mimeType: AllowedAudioType
    ) => Promise<string>;
    removeCustomSound: (id: string) => Promise<void>;
}

export const useNotificationStore = create<NotificationStore>()(
    persist(
        (set, get) => ({
            // Persisted defaults (opt-out, so enabled by default)
            notificationsEnabled: true,
            browserNotificationsEnabled: true,
            soundEnabled: true,
            selectedSound: "notification-1",

            // Runtime state
            browserPermission: getInitialBrowserPermission(),
            customSounds: [],
            customSoundsLoaded: false,
            customSoundsLoading: false,

            // Actions
            setNotificationsEnabled: (enabled) =>
                set({ notificationsEnabled: enabled }),
            setBrowserNotificationsEnabled: (enabled) =>
                set({ browserNotificationsEnabled: enabled }),
            setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
            setSelectedSound: (sound) => set({ selectedSound: sound }),
            setBrowserPermission: (permission) =>
                set({ browserPermission: permission }),

            // Custom sounds actions
            loadCustomSounds: async () => {
                const { customSoundsLoaded, customSoundsLoading } = get();
                if (customSoundsLoaded || customSoundsLoading) return;

                set({ customSoundsLoading: true });
                try {
                    const sounds = await getAllCustomSoundsMeta();
                    set({
                        customSounds: sounds,
                        customSoundsLoaded: true,
                        customSoundsLoading: false
                    });
                } catch (error) {
                    console.error("Failed to load custom sounds:", error);
                    set({
                        customSoundsLoaded: true,
                        customSoundsLoading: false
                    });
                }
            },

            addCustomSound: async (name, blob, mimeType) => {
                const id = await saveCustomSoundToDB(name, blob, mimeType);
                const newSound: CustomSoundMeta = {
                    id,
                    name,
                    mimeType,
                    createdAt: Date.now()
                };
                set((state) => ({
                    customSounds: [newSound, ...state.customSounds]
                }));
                return id;
            },

            removeCustomSound: async (id) => {
                const { selectedSound } = get();

                // If the deleted sound is currently selected, reset to default
                if (selectedSound === `custom:${id}`) {
                    set({ selectedSound: "notification-1" });
                }

                await deleteCustomSoundFromDB(id);
                set((state) => ({
                    customSounds: state.customSounds.filter((s) => s.id !== id)
                }));
            }
        }),
        {
            name: "opencode-notifications",
            partialize: (state) => ({
                notificationsEnabled: state.notificationsEnabled,
                browserNotificationsEnabled: state.browserNotificationsEnabled,
                soundEnabled: state.soundEnabled,
                selectedSound: state.selectedSound
            })
        }
    )
);
