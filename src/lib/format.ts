/**
 * Get a display name from a directory path
 * e.g., "/Users/michaelfaisst/Work/Private/opencode-web" -> "opencode-web"
 */
export function getProjectName(directory: string): string {
    if (directory === "/") return "global";
    const parts = directory.split("/").filter(Boolean);
    return parts[parts.length - 1] || directory;
}

/**
 * Get a human-readable "time ago" string from a date
 */
export function getTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}

/**
 * Get a short "time ago" string without the "ago" suffix
 * e.g., "30m", "3h", "2d"
 */
export function getTimeAgoShort(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;

    return date.toLocaleDateString();
}

/**
 * Formats a timestamp for display.
 * - Today: time only (e.g., "2:34 PM")
 * - This year but not today: month + day + time (e.g., "Dec 20, 2:34 PM")
 * - Different year: month + day + year + time (e.g., "Dec 20, 2024, 2:34 PM")
 */
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const isThisYear = date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit"
    });

    if (isToday) {
        return timeStr;
    }

    const dateOptions: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
        ...(isThisYear ? {} : { year: "numeric" })
    };

    const dateStr = date.toLocaleDateString([], dateOptions);

    return `${dateStr}, ${timeStr}`;
}
