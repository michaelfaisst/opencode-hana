import type { Session } from "@opencode-ai/sdk/client";

export interface SessionGroup {
    directory: string;
    projectName: string;
    sessions: Session[];
    mostRecentUpdate: number;
}

export interface SessionsSidebarProps {
    /** @deprecated No longer needed - dialog handles project selection */
    currentDirectory?: string;
    /** When true, always renders expanded and hides collapse controls (for mobile sheet) */
    forceExpanded?: boolean;
    /** Called when a session is selected (for closing mobile sheet) */
    onSessionSelect?: () => void;
    /** When true, sidebar is inside Allotment and should use full width */
    inAllotment?: boolean;
    /** Collapsed state when controlled by parent (Allotment) */
    isCollapsed?: boolean;
    /** Callback when collapse button is clicked (for Allotment integration) */
    onCollapse?: () => void;
}
