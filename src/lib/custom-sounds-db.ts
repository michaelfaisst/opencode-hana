/**
 * Custom sounds database operations
 * Handles CRUD for audio files stored in IndexedDB
 */

import { openDatabase, generateId, isIndexedDBAvailable } from "./indexed-db";

const STORE_NAME = "custom-sounds";

/**
 * Allowed audio MIME types
 */
export const ALLOWED_AUDIO_TYPES = [
    "audio/mpeg", // .mp3
    "audio/wav", // .wav
    "audio/ogg", // .ogg
    "audio/webm" // .webm (bonus)
] as const;

export type AllowedAudioType = (typeof ALLOWED_AUDIO_TYPES)[number];

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_AUDIO_SIZE = 5 * 1024 * 1024;

/**
 * Custom sound entry stored in IndexedDB
 */
export interface CustomSound {
    id: string;
    name: string;
    mimeType: AllowedAudioType;
    blob: Blob;
    createdAt: number;
}

/**
 * Custom sound metadata (without the blob, for UI state)
 */
export interface CustomSoundMeta {
    id: string;
    name: string;
    mimeType: AllowedAudioType;
    createdAt: number;
}

/**
 * Validate an audio file before saving
 */
export function validateAudioFile(
    file: File
): { valid: true } | { valid: false; error: string } {
    if (!ALLOWED_AUDIO_TYPES.includes(file.type as AllowedAudioType)) {
        return {
            valid: false,
            error: `Invalid file type. Allowed: MP3, WAV, OGG`
        };
    }

    if (file.size > MAX_AUDIO_SIZE) {
        const maxMB = MAX_AUDIO_SIZE / (1024 * 1024);
        return {
            valid: false,
            error: `File too large. Maximum size: ${maxMB}MB`
        };
    }

    return { valid: true };
}

/**
 * Save a custom sound to IndexedDB
 */
export async function saveCustomSound(
    name: string,
    blob: Blob,
    mimeType: AllowedAudioType
): Promise<string> {
    if (!isIndexedDBAvailable()) {
        throw new Error("IndexedDB is not available");
    }

    const db = await openDatabase();
    const id = generateId();

    const sound: CustomSound = {
        id,
        name,
        mimeType,
        blob,
        createdAt: Date.now()
    };

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.add(sound);

        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get a custom sound by ID
 */
export async function getCustomSound(
    id: string
): Promise<CustomSound | undefined> {
    if (!isIndexedDBAvailable()) {
        return undefined;
    }

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get all custom sounds (metadata only, without blobs for performance)
 */
export async function getAllCustomSoundsMeta(): Promise<CustomSoundMeta[]> {
    if (!isIndexedDBAvailable()) {
        return [];
    }

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            const sounds = request.result as CustomSound[];
            // Return metadata only (exclude blob)
            const meta: CustomSoundMeta[] = sounds.map(
                ({ id, name, mimeType, createdAt }) => ({
                    id,
                    name,
                    mimeType,
                    createdAt
                })
            );
            // Sort by creation date, newest first
            meta.sort((a, b) => b.createdAt - a.createdAt);
            resolve(meta);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Delete a custom sound by ID
 */
export async function deleteCustomSound(id: string): Promise<void> {
    if (!isIndexedDBAvailable()) {
        throw new Error("IndexedDB is not available");
    }

    const db = await openDatabase();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * Create a blob URL for playing a custom sound
 * Remember to revoke the URL after use to prevent memory leaks!
 */
export async function createCustomSoundUrl(id: string): Promise<string | null> {
    const sound = await getCustomSound(id);
    if (!sound) {
        return null;
    }
    return URL.createObjectURL(sound.blob);
}

/**
 * Get filename without extension from a file
 */
export function getFileNameWithoutExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return filename;
    return filename.substring(0, lastDot);
}
