/**
 * Core IndexedDB initialization and helpers for opencode-hana
 * Database name is generic to support multiple object stores in the future
 */

const DB_NAME = "opencode-hana";
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize and open the IndexedDB database
 * Creates object stores if they don't exist
 */
export function openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        // Return cached instance if available
        if (dbInstance) {
            resolve(dbInstance);
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            console.error("Failed to open IndexedDB:", request.error);
            reject(request.error);
        };

        request.onsuccess = () => {
            dbInstance = request.result;

            // Handle connection close
            dbInstance.onclose = () => {
                dbInstance = null;
            };

            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create custom-sounds object store
            if (!db.objectStoreNames.contains("custom-sounds")) {
                const store = db.createObjectStore("custom-sounds", {
                    keyPath: "id"
                });
                store.createIndex("createdAt", "createdAt", { unique: false });
                store.createIndex("name", "name", { unique: false });
            }

            // Future object stores can be added here in subsequent versions
        };
    });
}

/**
 * Check if IndexedDB is available in the current environment
 */
export function isIndexedDBAvailable(): boolean {
    try {
        return (
            typeof window !== "undefined" &&
            "indexedDB" in window &&
            window.indexedDB !== null
        );
    } catch {
        return false;
    }
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}

/**
 * Generate a unique ID for database entries
 */
export function generateId(): string {
    return crypto.randomUUID();
}
