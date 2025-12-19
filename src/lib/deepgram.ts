/**
 * Deepgram SDK wrapper for real-time speech-to-text transcription.
 */

import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import type { LiveClient, ListenLiveClient } from "@deepgram/sdk";

export { LiveTranscriptionEvents };
export type { LiveClient, ListenLiveClient };

/**
 * Configuration options for Deepgram live transcription
 */
export interface DeepgramLiveConfig {
    model?: string;
    language?: string;
    smart_format?: boolean;
    interim_results?: boolean;
    utterance_end_ms?: number;
    vad_events?: boolean;
    endpointing?: number | false;
}

/**
 * Default configuration for live transcription
 */
export const DEFAULT_LIVE_CONFIG: DeepgramLiveConfig = {
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    interim_results: true,
    utterance_end_ms: 1000,
    vad_events: true,
    endpointing: 300
};

/**
 * Create a Deepgram client instance
 */
export function createDeepgramClient(apiKey: string) {
    return createClient(apiKey);
}

/**
 * Create a live transcription connection
 */
export function createLiveConnection(
    apiKey: string,
    config: DeepgramLiveConfig = {}
): ListenLiveClient {
    const client = createDeepgramClient(apiKey);
    const mergedConfig = { ...DEFAULT_LIVE_CONFIG, ...config };

    return client.listen.live(mergedConfig);
}
