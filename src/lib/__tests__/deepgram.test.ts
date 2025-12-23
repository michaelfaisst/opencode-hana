import { DEFAULT_LIVE_CONFIG } from "../deepgram";

describe("Deepgram configuration", () => {
    describe("DEFAULT_LIVE_CONFIG", () => {
        it("has the expected default model", () => {
            expect(DEFAULT_LIVE_CONFIG.model).toBe("nova-2");
        });

        it("has the expected default language", () => {
            expect(DEFAULT_LIVE_CONFIG.language).toBe("en-US");
        });

        it("has smart_format enabled", () => {
            expect(DEFAULT_LIVE_CONFIG.smart_format).toBe(true);
        });

        it("has interim_results enabled", () => {
            expect(DEFAULT_LIVE_CONFIG.interim_results).toBe(true);
        });

        it("has the expected utterance_end_ms value", () => {
            expect(DEFAULT_LIVE_CONFIG.utterance_end_ms).toBe(1000);
        });

        it("has vad_events enabled", () => {
            expect(DEFAULT_LIVE_CONFIG.vad_events).toBe(true);
        });

        it("has the expected endpointing value", () => {
            expect(DEFAULT_LIVE_CONFIG.endpointing).toBe(300);
        });

        it("contains all expected configuration keys", () => {
            const expectedKeys = [
                "model",
                "language",
                "smart_format",
                "interim_results",
                "utterance_end_ms",
                "vad_events",
                "endpointing"
            ];

            expectedKeys.forEach((key) => {
                expect(DEFAULT_LIVE_CONFIG).toHaveProperty(key);
            });
        });
    });
});
