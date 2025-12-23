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
            store.setShowMessageTimestamps(false);
            store.setShowSessionTimestamps(true);
            store.setVoiceInputEnabled(false);
            store.setVoiceInputApiKey(null);
            store.setVoiceInputLanguage("en-US");
            store.setAssistantNameSource("default");
            store.setAssistantCustomName("");
            store.setAssistantAvatar(null);
            store.setAssistantSystemPrompt("");
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
            expect(useAppSettingsStore.getState().replaceSessionOnNew).toBe(
                false
            );
        });

        it("has voice input disabled with default language", () => {
            const { voiceInput } = useAppSettingsStore.getState();
            expect(voiceInput.enabled).toBe(false);
            expect(voiceInput.apiKey).toBeNull();
            expect(voiceInput.language).toBe("en-US");
        });

        it("has default assistant persona settings", () => {
            const { assistantPersona } = useAppSettingsStore.getState();
            expect(assistantPersona.nameSource).toBe("default");
            expect(assistantPersona.customName).toBe("");
            expect(assistantPersona.avatarBase64).toBeNull();
            expect(assistantPersona.customSystemPrompt).toBe("");
        });

        it("has message timestamps disabled by default", () => {
            expect(useAppSettingsStore.getState().showMessageTimestamps).toBe(
                false
            );
        });

        it("has session timestamps enabled by default", () => {
            expect(useAppSettingsStore.getState().showSessionTimestamps).toBe(
                true
            );
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
                useAppSettingsStore
                    .getState()
                    .setDefaultModel({ providerID: "test", modelID: "test" });
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
            expect(useAppSettingsStore.getState().replaceSessionOnNew).toBe(
                true
            );
        });
    });

    describe("voice input settings", () => {
        it("setVoiceInputEnabled updates enabled state", () => {
            act(() => {
                useAppSettingsStore.getState().setVoiceInputEnabled(true);
            });
            expect(useAppSettingsStore.getState().voiceInput.enabled).toBe(
                true
            );
        });

        it("setVoiceInputApiKey updates the API key", () => {
            act(() => {
                useAppSettingsStore
                    .getState()
                    .setVoiceInputApiKey("test-api-key");
            });
            expect(useAppSettingsStore.getState().voiceInput.apiKey).toBe(
                "test-api-key"
            );
        });

        it("setVoiceInputLanguage updates the language", () => {
            act(() => {
                useAppSettingsStore.getState().setVoiceInputLanguage("de-DE");
            });
            expect(useAppSettingsStore.getState().voiceInput.language).toBe(
                "de-DE"
            );
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

    describe("timestamp visibility settings", () => {
        it("setShowMessageTimestamps updates the setting", () => {
            act(() => {
                useAppSettingsStore.getState().setShowMessageTimestamps(true);
            });
            expect(useAppSettingsStore.getState().showMessageTimestamps).toBe(
                true
            );

            act(() => {
                useAppSettingsStore.getState().setShowMessageTimestamps(false);
            });
            expect(useAppSettingsStore.getState().showMessageTimestamps).toBe(
                false
            );
        });

        it("setShowSessionTimestamps updates the setting", () => {
            act(() => {
                useAppSettingsStore.getState().setShowSessionTimestamps(false);
            });
            expect(useAppSettingsStore.getState().showSessionTimestamps).toBe(
                false
            );

            act(() => {
                useAppSettingsStore.getState().setShowSessionTimestamps(true);
            });
            expect(useAppSettingsStore.getState().showSessionTimestamps).toBe(
                true
            );
        });
    });

    describe("assistant persona settings", () => {
        it("setAssistantNameSource updates the name source", () => {
            act(() => {
                useAppSettingsStore.getState().setAssistantNameSource("model");
            });
            expect(
                useAppSettingsStore.getState().assistantPersona.nameSource
            ).toBe("model");

            act(() => {
                useAppSettingsStore.getState().setAssistantNameSource("custom");
            });
            expect(
                useAppSettingsStore.getState().assistantPersona.nameSource
            ).toBe("custom");

            act(() => {
                useAppSettingsStore
                    .getState()
                    .setAssistantNameSource("default");
            });
            expect(
                useAppSettingsStore.getState().assistantPersona.nameSource
            ).toBe("default");
        });

        it("setAssistantCustomName updates the custom name", () => {
            act(() => {
                useAppSettingsStore
                    .getState()
                    .setAssistantCustomName("My Assistant");
            });
            expect(
                useAppSettingsStore.getState().assistantPersona.customName
            ).toBe("My Assistant");
        });

        it("setAssistantCustomName can set empty string", () => {
            act(() => {
                useAppSettingsStore
                    .getState()
                    .setAssistantCustomName("Some Name");
                useAppSettingsStore.getState().setAssistantCustomName("");
            });
            expect(
                useAppSettingsStore.getState().assistantPersona.customName
            ).toBe("");
        });

        it("setAssistantAvatar updates the avatar base64", () => {
            const testBase64 =
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUg...";
            act(() => {
                useAppSettingsStore.getState().setAssistantAvatar(testBase64);
            });
            expect(
                useAppSettingsStore.getState().assistantPersona.avatarBase64
            ).toBe(testBase64);
        });

        it("setAssistantAvatar can clear the avatar", () => {
            act(() => {
                useAppSettingsStore
                    .getState()
                    .setAssistantAvatar("some-base64-data");
                useAppSettingsStore.getState().setAssistantAvatar(null);
            });
            expect(
                useAppSettingsStore.getState().assistantPersona.avatarBase64
            ).toBeNull();
        });

        it("setAssistantSystemPrompt updates the system prompt", () => {
            const testPrompt =
                "You are a helpful assistant that speaks like a pirate.";
            act(() => {
                useAppSettingsStore
                    .getState()
                    .setAssistantSystemPrompt(testPrompt);
            });
            expect(
                useAppSettingsStore.getState().assistantPersona
                    .customSystemPrompt
            ).toBe(testPrompt);
        });

        it("setAssistantSystemPrompt can set empty string", () => {
            act(() => {
                useAppSettingsStore
                    .getState()
                    .setAssistantSystemPrompt("Some prompt");
                useAppSettingsStore.getState().setAssistantSystemPrompt("");
            });
            expect(
                useAppSettingsStore.getState().assistantPersona
                    .customSystemPrompt
            ).toBe("");
        });

        it("assistant persona settings are independent of each other", () => {
            act(() => {
                useAppSettingsStore.getState().setAssistantNameSource("custom");
                useAppSettingsStore.getState().setAssistantCustomName("Claude");
                useAppSettingsStore
                    .getState()
                    .setAssistantAvatar("avatar-data");
                useAppSettingsStore
                    .getState()
                    .setAssistantSystemPrompt("Be helpful");
            });

            const { assistantPersona } = useAppSettingsStore.getState();
            expect(assistantPersona.nameSource).toBe("custom");
            expect(assistantPersona.customName).toBe("Claude");
            expect(assistantPersona.avatarBase64).toBe("avatar-data");
            expect(assistantPersona.customSystemPrompt).toBe("Be helpful");
        });
    });
});
