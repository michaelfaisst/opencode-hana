import { useCallback, useRef } from "react";
import { Music, Trash2, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNotificationStore, type CustomNotificationSound } from "@/stores";
import { previewSound } from "@/lib/notifications";
import type { CustomSoundMeta } from "@/lib/custom-sounds-db";

interface CustomSoundsListProps {
    sounds: CustomSoundMeta[];
    selectedSound: string;
    onSelect: (sound: CustomNotificationSound) => void;
}

export function CustomSoundsList({
    sounds,
    selectedSound,
    onSelect
}: CustomSoundsListProps) {
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { removeCustomSound } = useNotificationStore();

    const handlePreview = useCallback((id: string) => {
        // Stop any currently playing audio
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        previewSound(`custom:${id}` as CustomNotificationSound);
    }, []);

    const handleDelete = useCallback(
        async (sound: CustomSoundMeta) => {
            try {
                await removeCustomSound(sound.id);
                toast.success(`Deleted "${sound.name}"`);
            } catch (error) {
                console.error("Failed to delete custom sound:", error);
                toast.error("Failed to delete custom sound");
            }
        },
        [removeCustomSound]
    );

    const handleSelect = useCallback(
        (id: string) => {
            onSelect(`custom:${id}` as CustomNotificationSound);
        },
        [onSelect]
    );

    if (sounds.length === 0) {
        return null;
    }

    return (
        <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">
                Custom sounds
            </p>
            <div className="space-y-1">
                {sounds.map((sound) => {
                    const soundId =
                        `custom:${sound.id}` as CustomNotificationSound;
                    const isSelected = selectedSound === soundId;

                    return (
                        <div
                            key={sound.id}
                            className={`flex items-center gap-2 p-2 rounded-md border transition-colors ${
                                isSelected
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:bg-muted/50"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={() => handleSelect(sound.id)}
                                className="flex items-center gap-2 flex-1 min-w-0 text-left"
                            >
                                <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="truncate text-sm">
                                    {sound.name}
                                </span>
                                {isSelected && (
                                    <span className="text-xs text-primary font-medium shrink-0">
                                        Selected
                                    </span>
                                )}
                            </button>

                            <div className="flex items-center gap-1 shrink-0">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => handlePreview(sound.id)}
                                    title="Preview sound"
                                >
                                    <Volume2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(sound)}
                                    title="Delete sound"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
