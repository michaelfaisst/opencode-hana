import { act } from "@testing-library/react";
import { useAppSettingsStore } from "../app-settings-store";

describe("useAppSettingsStore", () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset store to defaults
    act(() => {
      const store = useAppSettingsStore.getState();
      store.setDefaultModel(null);
      store.setSelectedModel(null);
      store.setAgentMode("build");
      store.setReplaceSessionOnNew(false);
      store.setVoiceInputEnabled(false);
      store.setVoiceInputApiKey(null);
      store.setVoiceInputLanguage("en-US");
    });
  });

  describe("initial state", () => {
    it("has null defaultModel", () => {
      expect(useAppSettingsStore.getState().defaultModel).toBeNull();
    });

    it("has null selectedModel", () => {
      expect(useAppSettingsStore.getState().selectedModel).toBeNull();
    });

    it("has 'build' as default agentMode", () => {
      expect(useAppSettingsStore.getState().agentMode).toBe("build");
    });

    it("has replaceSessionOnNew disabled", () => {
      expect(useAppSettingsStore.getState().replaceSessionOnNew).toBe(false);
    });

    it("has voice input disabled with default language", () => {
      const { voiceInput } = useAppSettingsStore.getState();
      expect(voiceInput.enabled).toBe(false);
      expect(voiceInput.apiKey).toBeNull();
      expect(voiceInput.language).toBe("en-US");
    });
  });

  describe("setDefaultModel", () => {
    it("sets the default model", () => {
      const model = { providerID: "openai", modelID: "gpt-4" };
      act(() => {
        useAppSettingsStore.getState().setDefaultModel(model);
      });
      expect(useAppSettingsStore.getState().defaultModel).toEqual(model);
    });

    it("can clear the default model", () => {
      act(() => {
        useAppSettingsStore.getState().setDefaultModel({ providerID: "test", modelID: "test" });
        useAppSettingsStore.getState().setDefaultModel(null);
      });
      expect(useAppSettingsStore.getState().defaultModel).toBeNull();
    });
  });

  describe("setSelectedModel", () => {
    it("sets the selected model", () => {
      const model = { providerID: "anthropic", modelID: "claude-3" };
      act(() => {
        useAppSettingsStore.getState().setSelectedModel(model);
      });
      expect(useAppSettingsStore.getState().selectedModel).toEqual(model);
    });
  });

  describe("agent mode", () => {
    it("setAgentMode updates the mode", () => {
      act(() => {
        useAppSettingsStore.getState().setAgentMode("plan");
      });
      expect(useAppSettingsStore.getState().agentMode).toBe("plan");

      act(() => {
        useAppSettingsStore.getState().setAgentMode("build");
      });
      expect(useAppSettingsStore.getState().agentMode).toBe("build");
    });

    it("toggleAgentMode toggles between plan and build", () => {
      expect(useAppSettingsStore.getState().agentMode).toBe("build");

      act(() => {
        useAppSettingsStore.getState().toggleAgentMode();
      });
      expect(useAppSettingsStore.getState().agentMode).toBe("plan");

      act(() => {
        useAppSettingsStore.getState().toggleAgentMode();
      });
      expect(useAppSettingsStore.getState().agentMode).toBe("build");
    });
  });

  describe("setReplaceSessionOnNew", () => {
    it("updates the replaceSessionOnNew setting", () => {
      act(() => {
        useAppSettingsStore.getState().setReplaceSessionOnNew(true);
      });
      expect(useAppSettingsStore.getState().replaceSessionOnNew).toBe(true);
    });
  });

  describe("voice input settings", () => {
    it("setVoiceInputEnabled updates enabled state", () => {
      act(() => {
        useAppSettingsStore.getState().setVoiceInputEnabled(true);
      });
      expect(useAppSettingsStore.getState().voiceInput.enabled).toBe(true);
    });

    it("setVoiceInputApiKey updates the API key", () => {
      act(() => {
        useAppSettingsStore.getState().setVoiceInputApiKey("test-api-key");
      });
      expect(useAppSettingsStore.getState().voiceInput.apiKey).toBe("test-api-key");
    });

    it("setVoiceInputLanguage updates the language", () => {
      act(() => {
        useAppSettingsStore.getState().setVoiceInputLanguage("de-DE");
      });
      expect(useAppSettingsStore.getState().voiceInput.language).toBe("de-DE");
    });

    it("voice input settings are independent of each other", () => {
      act(() => {
        useAppSettingsStore.getState().setVoiceInputEnabled(true);
        useAppSettingsStore.getState().setVoiceInputApiKey("my-key");
        useAppSettingsStore.getState().setVoiceInputLanguage("fr-FR");
      });

      const { voiceInput } = useAppSettingsStore.getState();
      expect(voiceInput.enabled).toBe(true);
      expect(voiceInput.apiKey).toBe("my-key");
      expect(voiceInput.language).toBe("fr-FR");
    });
  });
});
