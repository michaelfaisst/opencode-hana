import { act } from "@testing-library/react";
import { useNotificationStore, NOTIFICATION_SOUNDS } from "../notification-store";

describe("useNotificationStore", () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear();
    // Reset to initial state
    act(() => {
      const store = useNotificationStore.getState();
      store.setNotificationsEnabled(true);
      store.setBrowserNotificationsEnabled(true);
      store.setSoundEnabled(true);
      store.setSelectedSound("notification-1");
    });
  });

  describe("NOTIFICATION_SOUNDS constant", () => {
    it("has 4 notification sound options", () => {
      expect(NOTIFICATION_SOUNDS).toHaveLength(4);
    });

    it("has expected sound IDs", () => {
      const ids = NOTIFICATION_SOUNDS.map((s) => s.id);
      expect(ids).toContain("notification-1");
      expect(ids).toContain("notification-2");
      expect(ids).toContain("notification-3");
      expect(ids).toContain("notification-4");
    });
  });

  describe("initial state", () => {
    it("has notifications enabled by default", () => {
      expect(useNotificationStore.getState().notificationsEnabled).toBe(true);
    });

    it("has browser notifications enabled by default", () => {
      expect(useNotificationStore.getState().browserNotificationsEnabled).toBe(true);
    });

    it("has sound enabled by default", () => {
      expect(useNotificationStore.getState().soundEnabled).toBe(true);
    });

    it("has notification-1 as default sound", () => {
      expect(useNotificationStore.getState().selectedSound).toBe("notification-1");
    });
  });

  describe("setNotificationsEnabled", () => {
    it("updates notificationsEnabled state", () => {
      act(() => {
        useNotificationStore.getState().setNotificationsEnabled(false);
      });
      expect(useNotificationStore.getState().notificationsEnabled).toBe(false);

      act(() => {
        useNotificationStore.getState().setNotificationsEnabled(true);
      });
      expect(useNotificationStore.getState().notificationsEnabled).toBe(true);
    });
  });

  describe("setBrowserNotificationsEnabled", () => {
    it("updates browserNotificationsEnabled state", () => {
      act(() => {
        useNotificationStore.getState().setBrowserNotificationsEnabled(false);
      });
      expect(useNotificationStore.getState().browserNotificationsEnabled).toBe(false);
    });
  });

  describe("setSoundEnabled", () => {
    it("updates soundEnabled state", () => {
      act(() => {
        useNotificationStore.getState().setSoundEnabled(false);
      });
      expect(useNotificationStore.getState().soundEnabled).toBe(false);
    });
  });

  describe("setSelectedSound", () => {
    it("updates selectedSound state", () => {
      act(() => {
        useNotificationStore.getState().setSelectedSound("notification-3");
      });
      expect(useNotificationStore.getState().selectedSound).toBe("notification-3");
    });
  });

  describe("setBrowserPermission", () => {
    it("updates browserPermission state", () => {
      act(() => {
        useNotificationStore.getState().setBrowserPermission("granted");
      });
      expect(useNotificationStore.getState().browserPermission).toBe("granted");

      act(() => {
        useNotificationStore.getState().setBrowserPermission("denied");
      });
      expect(useNotificationStore.getState().browserPermission).toBe("denied");
    });
  });
});
