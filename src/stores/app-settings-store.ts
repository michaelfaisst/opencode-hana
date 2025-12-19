import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AgentMode = "plan" | "build";

export interface SelectedModel {
  providerID: string;
  modelID: string;
}

export interface VoiceInputSettings {
  enabled: boolean;
  apiKey: string | null;
  language: string;
}

interface AppSettingsStore {
  // Persisted settings
  defaultModel: SelectedModel | null;
  agentMode: AgentMode;
  replaceSessionOnNew: boolean;
  voiceInput: VoiceInputSettings;

  // Runtime state (not persisted)
  selectedModel: SelectedModel | null;

  // Actions
  setDefaultModel: (model: SelectedModel | null) => void;
  setSelectedModel: (model: SelectedModel | null) => void;
  setAgentMode: (mode: AgentMode) => void;
  toggleAgentMode: () => void;
  setReplaceSessionOnNew: (replace: boolean) => void;
  setVoiceInputEnabled: (enabled: boolean) => void;
  setVoiceInputApiKey: (apiKey: string | null) => void;
  setVoiceInputLanguage: (language: string) => void;
}

export const useAppSettingsStore = create<AppSettingsStore>()(
  persist(
    (set) => ({
      // Persisted defaults
      defaultModel: null,
      agentMode: "build",
      replaceSessionOnNew: false,
      voiceInput: {
        enabled: false,
        apiKey: null,
        language: "en-US",
      },

      // Runtime state
      selectedModel: null,

      // Actions
      setDefaultModel: (model) => set({ defaultModel: model }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      setAgentMode: (mode) => set({ agentMode: mode }),
      toggleAgentMode: () =>
        set((state) => ({
          agentMode: state.agentMode === "plan" ? "build" : "plan",
        })),
      setReplaceSessionOnNew: (replace) => set({ replaceSessionOnNew: replace }),
      setVoiceInputEnabled: (enabled) =>
        set((state) => ({
          voiceInput: { ...state.voiceInput, enabled },
        })),
      setVoiceInputApiKey: (apiKey) =>
        set((state) => ({
          voiceInput: { ...state.voiceInput, apiKey },
        })),
      setVoiceInputLanguage: (language) =>
        set((state) => ({
          voiceInput: { ...state.voiceInput, language },
        })),
    }),
    {
      name: "opencode-settings",
      partialize: (state) => ({
        defaultModel: state.defaultModel,
        agentMode: state.agentMode,
        replaceSessionOnNew: state.replaceSessionOnNew,
        voiceInput: state.voiceInput,
      }),
    }
  )
);
