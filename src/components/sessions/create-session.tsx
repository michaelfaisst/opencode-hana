import { useState, useMemo, useCallback } from "react";
import { Plus, Folder } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
    Combobox,
    ComboboxSelectTrigger,
    ComboboxPopupInput,
    ComboboxContent,
    ComboboxList,
    ComboboxItem,
    ComboboxEmpty,
    ComboboxValue
} from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProjects, useCurrentProject, getProjectName } from "@/hooks";

interface CreateSessionDialogProps {
    onCreateSession: (params: { title?: string; directory: string }) => void;
    isLoading?: boolean;
    /** Controlled open state */
    open?: boolean;
    /** Callback when open state changes (for controlled mode) */
    onOpenChange?: (open: boolean) => void;
    /** Whether to show the trigger button (defaults to true) */
    showTrigger?: boolean;
}

export function CreateSessionDialog({
    onCreateSession,
    isLoading,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    showTrigger = true
}: CreateSessionDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    // Determine if we're in controlled or uncontrolled mode
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled
        ? (controlledOnOpenChange ?? (() => {}))
        : setInternalOpen;
    const [title, setTitle] = useState("");
    const [selectedProject, setSelectedProject] = useState<string>("");
    const [inputValue, setInputValue] = useState("");

    const { data: projects, isLoading: isLoadingProjects } = useProjects();
    const { data: currentProject } = useCurrentProject();

    // Set default project when dialog opens
    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (isOpen && currentProject && !selectedProject) {
            setSelectedProject(currentProject.worktree);
        }
    };

    // Clear search when combobox popup opens
    const handleComboboxOpenChange = (open: boolean) => {
        if (open) {
            setInputValue("");
        }
    };

    // Build options for the combobox
    const projectOptions = useMemo(() => {
        if (!projects) return [];
        return projects.map((project) => ({
            value: project.worktree,
            label: getProjectName(project),
            path: project.worktree
        }));
    }, [projects]);

    // Filter projects based on search input
    const filteredProjects = useMemo(() => {
        const query = inputValue.toLowerCase().trim();
        if (!query) return projectOptions;
        return projectOptions.filter(
            (p) =>
                p.label.toLowerCase().includes(query) ||
                p.path.toLowerCase().includes(query)
        );
    }, [projectOptions, inputValue]);

    // Convert value to label for display
    const itemToStringLabel = useCallback(
        (value: string) => {
            const project = projectOptions.find((p) => p.value === value);
            return project?.label ?? value;
        },
        [projectOptions]
    );

    const handleCreate = () => {
        if (!selectedProject) return;
        onCreateSession({
            title: title || undefined,
            directory: selectedProject
        });
        setTitle("");
        setSelectedProject("");
        setInputValue("");
        setOpen(false);
    };

    const canCreate = !!selectedProject && !isLoading && !isLoadingProjects;

    return (
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
            {showTrigger && (
                <AlertDialogTrigger
                    render={
                        <Button size="icon" className="h-9 w-9">
                            <Plus className="h-4 w-4" />
                            <span className="sr-only">New session</span>
                        </Button>
                    }
                />
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>New Session</AlertDialogTitle>
                    <AlertDialogDescription>
                        Create a new chat session in a project directory.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="session-project">Project</Label>
                        <Combobox
                            value={selectedProject}
                            onValueChange={(value) =>
                                setSelectedProject(value ?? "")
                            }
                            inputValue={inputValue}
                            onInputValueChange={setInputValue}
                            onOpenChange={handleComboboxOpenChange}
                            disabled={isLoadingProjects}
                            itemToStringLabel={itemToStringLabel}
                        >
                            <ComboboxSelectTrigger
                                id="session-project"
                                className="w-full"
                                disabled={isLoadingProjects}
                            >
                                <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
                                <ComboboxValue>
                                    {(val) =>
                                        isLoadingProjects
                                            ? "Loading projects..."
                                            : val
                                              ? itemToStringLabel(val as string)
                                              : "Select a project..."
                                    }
                                </ComboboxValue>
                            </ComboboxSelectTrigger>
                            <ComboboxContent className="w-[var(--anchor-width)]">
                                <div className="p-1 border-b border-border">
                                    <ComboboxPopupInput
                                        placeholder="Search projects..."
                                        autoFocus
                                    />
                                </div>
                                <ComboboxList>
                                    {filteredProjects.length === 0 && (
                                        <ComboboxEmpty>
                                            No projects found
                                        </ComboboxEmpty>
                                    )}
                                    {filteredProjects.map((project) => (
                                        <ComboboxItem
                                            key={project.value}
                                            value={project.value}
                                        >
                                            <div className="flex flex-col min-w-0 overflow-hidden">
                                                <span className="truncate">
                                                    {project.label}
                                                </span>
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {project.path}
                                                </span>
                                            </div>
                                        </ComboboxItem>
                                    ))}
                                </ComboboxList>
                            </ComboboxContent>
                        </Combobox>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="session-title">Title (optional)</Label>
                        <Input
                            id="session-title"
                            placeholder="My coding session..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && canCreate) {
                                    handleCreate();
                                }
                            }}
                        />
                    </div>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleCreate}
                        disabled={!canCreate}
                    >
                        {isLoading ? "Creating..." : "Create"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
