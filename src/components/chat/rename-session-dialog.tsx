import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RenameSessionDialogProps {
    /** Whether the dialog is open */
    open: boolean;
    /** Callback when open state changes */
    onOpenChange: (open: boolean) => void;
    /** Current session title */
    currentTitle?: string;
    /** Callback when rename is confirmed */
    onRename: (newTitle: string) => void;
    /** Whether the rename operation is in progress */
    isLoading?: boolean;
}

export function RenameSessionDialog({
    open,
    onOpenChange,
    currentTitle,
    onRename,
    isLoading
}: RenameSessionDialogProps) {
    const [title, setTitle] = useState(currentTitle ?? "");
    const inputRef = useRef<HTMLInputElement>(null);

    // Handle dialog open state change and reset title when opening
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen) {
            setTitle(currentTitle ?? "");
        }
        onOpenChange(isOpen);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedTitle = title.trim();
        if (trimmedTitle) {
            onRename(trimmedTitle);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !isLoading && title.trim()) {
            e.preventDefault();
            onRename(title.trim());
        }
    };

    const canSubmit = title.trim() && !isLoading;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent initialFocus={inputRef}>
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Rename Session</DialogTitle>
                        <DialogDescription>
                            Enter a new name for this session.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <div className="space-y-2">
                            <Label htmlFor="session-title">Session Name</Label>
                            <Input
                                ref={inputRef}
                                id="session-title"
                                placeholder="Enter session name..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={!canSubmit}>
                            {isLoading ? "Renaming..." : "Rename"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
