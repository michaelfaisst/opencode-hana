import { useState, useEffect, useCallback } from "react";

export type AgentMode = "plan" | "build";

export interface SelectedModel {
  providerID: string;
  modelID: string;
}

export interface AppSettings {
  defaultModel: SelectedModel | null;
  agentMode: AgentMode;
  replaceSessionOnNew: boolean;
}

const SETTINGS_KEY = "opencode-settings";

const defaultSettings: AppSettings = {
  defaultModel: null,
  agentMode: "build",
  replaceSessionOnNew: false,
};

function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore parse errors
  }
  return defaultSettings;
}

function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }
}

export function useSettings() {
  const [settings, setSettingsState] = useState<AppSettings>(loadSettings);

  // Sync with localStorage on mount
  useEffect(() => {
    setSettingsState(loadSettings());
  }, []);

  const setSettings = useCallback((update: Partial<AppSettings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...update };
      saveSettings(next);
      return next;
    });
  }, []);

  const setDefaultModel = useCallback((model: SelectedModel | null) => {
    setSettings({ defaultModel: model });
  }, [setSettings]);

  const setAgentMode = useCallback((mode: AgentMode) => {
    setSettings({ agentMode: mode });
  }, [setSettings]);

  const setReplaceSessionOnNew = useCallback((replace: boolean) => {
    setSettings({ replaceSessionOnNew: replace });
  }, [setSettings]);

  return {
    settings,
    setDefaultModel,
    setAgentMode,
    setReplaceSessionOnNew,
  };
}
