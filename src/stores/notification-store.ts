import { create } from "zustand";
import { persist } from "zustand/middleware";

export type NotificationSound = 
  | "notification-1" 
  | "notification-2" 
  | "notification-3" 
  | "notification-4";

export interface NotificationSoundOption {
  id: NotificationSound;
  label: string;
}

export const NOTIFICATION_SOUNDS: NotificationSoundOption[] = [
  { id: "notification-1", label: "Notification 1" },
  { id: "notification-2", label: "Notification 2" },
  { id: "notification-3", label: "Notification 3" },
  { id: "notification-4", label: "Notification 4" },
];

interface NotificationStore {
  // Settings (persisted)
  notificationsEnabled: boolean;
  browserNotificationsEnabled: boolean;
  soundEnabled: boolean;
  selectedSound: NotificationSound;
  
  // Runtime state (not persisted)
  browserPermission: NotificationPermission;
  
  // Actions
  setNotificationsEnabled: (enabled: boolean) => void;
  setBrowserNotificationsEnabled: (enabled: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setSelectedSound: (sound: NotificationSound) => void;
  setBrowserPermission: (permission: NotificationPermission) => void;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set) => ({
      // Persisted defaults (opt-out, so enabled by default)
      notificationsEnabled: true,
      browserNotificationsEnabled: true,
      soundEnabled: true,
      selectedSound: "notification-1",
      
      // Runtime state
      browserPermission: typeof Notification !== "undefined" 
        ? Notification.permission 
        : "denied",
      
      // Actions
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setBrowserNotificationsEnabled: (enabled) => set({ browserNotificationsEnabled: enabled }),
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setSelectedSound: (sound) => set({ selectedSound: sound }),
      setBrowserPermission: (permission) => set({ browserPermission: permission }),
    }),
    {
      name: "opencode-notifications",
      partialize: (state) => ({
        notificationsEnabled: state.notificationsEnabled,
        browserNotificationsEnabled: state.browserNotificationsEnabled,
        soundEnabled: state.soundEnabled,
        selectedSound: state.selectedSound,
      }),
    }
  )
);
