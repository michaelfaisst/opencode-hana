import { useRef, useState, useCallback } from "react";
import { Upload, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useNotificationStore } from "@/stores";
import {
    validateAudioFile,
    getFileNameWithoutExtension,
    type AllowedAudioType
} from "@/lib/custom-sounds-db";

interface SoundUploadProps {
    onUploadComplete?: () => void;
}

export function SoundUpload({ onUploadComplete }: SoundUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [soundName, setSoundName] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const { addCustomSound } = useNotificationStore();

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Reset input so same file can be selected again
            e.target.value = "";

            // Validate file
            const validation = validateAudioFile(file);
            if (!validation.valid) {
                toast.error(validation.error);
                return;
            }

            // Revoke previous preview URL
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
            }

            // Create preview URL
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setSelectedFile(file);
            setSoundName(getFileNameWithoutExtension(file.name));
        },
        [previewUrl]
    );

    const handlePreview = useCallback(() => {
        if (!previewUrl) return;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }

        const audio = new Audio(previewUrl);
        audio.volume = 0.5;
        audioRef.current = audio;
        audio.play().catch((err) => {
            console.warn("Could not play preview:", err);
            toast.error("Could not play audio file");
        });
    }, [previewUrl]);

    const handleUpload = useCallback(async () => {
        if (!selectedFile || !soundName.trim()) {
            toast.error("Please select a file and enter a name");
            return;
        }

        setIsUploading(true);
        try {
            await addCustomSound(
                soundName.trim(),
                selectedFile,
                selectedFile.type as AllowedAudioType
            );

            toast.success(`Added "${soundName.trim()}" to custom sounds`);

            // Reset form
            setSelectedFile(null);
            setSoundName("");
            if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
            }

            onUploadComplete?.();
        } catch (error) {
            console.error("Failed to save custom sound:", error);
            toast.error("Failed to save custom sound");
        } finally {
            setIsUploading(false);
        }
    }, [selectedFile, soundName, addCustomSound, previewUrl, onUploadComplete]);

    const handleCancel = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setSelectedFile(null);
        setSoundName("");
        setPreviewUrl(null);
    }, [previewUrl]);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    // No file selected - show upload button
    if (!selectedFile) {
        return (
            <div className="space-y-2">
                <input
                    ref={inputRef}
                    type="file"
                    accept="audio/mpeg,audio/wav,audio/ogg,audio/webm,.mp3,.wav,.ogg,.webm"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleClick}
                    className="gap-2"
                >
                    <Upload className="h-4 w-4" />
                    Upload custom sound
                </Button>
                <p className="text-xs text-muted-foreground">
                    Supports MP3, WAV, OGG (max 5MB)
                </p>
            </div>
        );
    }

    // File selected - show preview and save form
    return (
        <div className="space-y-3 p-3 border border-border rounded-md bg-muted/30">
            <div className="flex items-center gap-2 text-sm">
                <Music className="h-4 w-4 text-muted-foreground" />
                <span className="truncate flex-1">{selectedFile.name}</span>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handlePreview}
                >
                    Preview
                </Button>
            </div>

            <div className="space-y-2">
                <Label htmlFor="sound-name">Sound name</Label>
                <Input
                    id="sound-name"
                    value={soundName}
                    onChange={(e) => setSoundName(e.target.value)}
                    placeholder="Enter a name for this sound"
                    className="max-w-sm"
                />
            </div>

            <div className="flex gap-2">
                <Button
                    type="button"
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploading || !soundName.trim()}
                >
                    {isUploading ? "Saving..." : "Save"}
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancel}
                    disabled={isUploading}
                >
                    Cancel
                </Button>
            </div>
        </div>
    );
}
