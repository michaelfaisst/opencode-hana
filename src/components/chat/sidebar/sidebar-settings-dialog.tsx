import { useState, useCallback, useMemo } from "react";
import { GripVertical, Settings2, RotateCcw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
    Tooltip,
    TooltipTrigger,
    TooltipContent
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
    useSidebarSettingsStore,
    DEFAULT_SECTIONS,
    type SidebarSection
} from "@/stores";

interface SidebarSettingsDialogProps {
    trigger?: React.ReactElement;
}

export function SidebarSettingsDialog({ trigger }: SidebarSettingsDialogProps) {
    const sections = useSidebarSettingsStore((state) => state.sections);
    const updateSections = useSidebarSettingsStore(
        (state) => state.updateSections
    );

    const [localSections, setLocalSections] =
        useState<SidebarSection[]>(sections);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [open, setOpen] = useState(false);

    // Sync local state when dialog opens
    const handleOpenChange = useCallback(
        (isOpen: boolean) => {
            if (isOpen) {
                setLocalSections(sections);
            }
            setOpen(isOpen);
        },
        [sections]
    );

    const handleToggle = useCallback((sectionId: string) => {
        setLocalSections((prev) =>
            prev.map((section) =>
                section.id === sectionId
                    ? { ...section, enabled: !section.enabled }
                    : section
            )
        );
    }, []);

    const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", index.toString());
        // Set drag image
        const element = e.currentTarget as HTMLElement;
        element.classList.add("opacity-50");
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        const element = e.currentTarget as HTMLElement;
        element.classList.remove("opacity-50");
        setDraggedIndex(null);
        setDragOverIndex(null);
    }, []);

    const handleDragOver = useCallback(
        (e: React.DragEvent, index: number) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (draggedIndex !== null && draggedIndex !== index) {
                setDragOverIndex(index);
            }
        },
        [draggedIndex]
    );

    const handleDragLeave = useCallback(() => {
        setDragOverIndex(null);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent, toIndex: number) => {
            e.preventDefault();
            const fromIndex = draggedIndex;
            if (fromIndex === null || fromIndex === toIndex) return;

            setLocalSections((prev) => {
                const newSections = [...prev];
                const [removed] = newSections.splice(fromIndex, 1);
                newSections.splice(toIndex, 0, removed);
                return newSections;
            });

            setDraggedIndex(null);
            setDragOverIndex(null);
        },
        [draggedIndex]
    );

    const handleSave = useCallback(() => {
        updateSections(localSections);
        setOpen(false);
    }, [localSections, updateSections]);

    const handleReset = useCallback(() => {
        setLocalSections([...DEFAULT_SECTIONS]);
    }, []);

    // Check if current local sections match defaults
    const isDefaultSettings = useMemo(() => {
        if (localSections.length !== DEFAULT_SECTIONS.length) return false;
        return localSections.every(
            (section, index) =>
                section.id === DEFAULT_SECTIONS[index].id &&
                section.enabled === DEFAULT_SECTIONS[index].enabled
        );
    }, [localSections]);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {trigger ? (
                <DialogTrigger render={trigger} />
            ) : (
                <Tooltip>
                    <TooltipTrigger
                        render={
                            <DialogTrigger
                                render={
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                    >
                                        <Settings2 className="h-4 w-4" />
                                    </Button>
                                }
                            />
                        }
                    />
                    <TooltipContent side="left">
                        Sidebar settings
                    </TooltipContent>
                </Tooltip>
            )}
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Sidebar Settings</DialogTitle>
                    <DialogDescription>
                        Enable or disable sidebar sections and drag to reorder
                        them.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="space-y-1">
                        {localSections.map((section, index) => (
                            <div
                                key={section.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, index)}
                                className={cn(
                                    "flex items-center gap-3 p-2 rounded-sm border border-transparent transition-colors",
                                    "hover:bg-accent/50 cursor-grab active:cursor-grabbing",
                                    dragOverIndex === index &&
                                        draggedIndex !== index &&
                                        "border-primary bg-primary/10",
                                    draggedIndex === index && "opacity-50"
                                )}
                            >
                                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="flex-1 text-sm">
                                    {section.label}
                                </span>
                                <Switch
                                    size="sm"
                                    checked={section.enabled}
                                    onCheckedChange={() =>
                                        handleToggle(section.id)
                                    }
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <DialogFooter className="flex-row justify-between sm:justify-between">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        disabled={isDefaultSettings}
                        className="gap-1.5"
                    >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Reset
                    </Button>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
