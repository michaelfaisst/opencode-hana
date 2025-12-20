import { useRef, useCallback, useState } from "react";
import { Bot, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ImageCropperDialog } from "./image-cropper-dialog";

interface AvatarUploadProps {
    avatarBase64: string | null;
    onAvatarChange: (base64: string | null) => void;
}

export function AvatarUpload({
    avatarBase64,
    onAvatarChange
}: AvatarUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [cropperOpen, setCropperOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            // Reset input so same file can be selected again
            e.target.value = "";

            if (!file.type.startsWith("image/")) {
                return;
            }

            // Read file and open cropper dialog
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setSelectedImage(dataUrl);
                setCropperOpen(true);
            };
            reader.readAsDataURL(file);
        },
        []
    );

    const handleCropComplete = useCallback(
        (croppedImageBase64: string) => {
            onAvatarChange(croppedImageBase64);
            setSelectedImage(null);
        },
        [onAvatarChange]
    );

    const handleCropperClose = useCallback((open: boolean) => {
        setCropperOpen(open);
        if (!open) {
            setSelectedImage(null);
        }
    }, []);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleRemove = useCallback(
        (e: React.MouseEvent) => {
            e.stopPropagation();
            onAvatarChange(null);
        },
        [onAvatarChange]
    );

    return (
        <>
            <div className="flex items-center gap-4">
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={handleClick}
                    className={cn(
                        "relative h-16 w-16 rounded-full border-2 border-dashed border-muted-foreground/25 flex items-center justify-center overflow-hidden transition-colors hover:border-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        avatarBase64 && "border-solid border-transparent"
                    )}
                >
                    {avatarBase64 ? (
                        <img
                            src={avatarBase64}
                            alt="Assistant avatar"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-1 text-muted-foreground">
                            <Bot className="h-6 w-6" />
                            <Upload className="h-3 w-3" />
                        </div>
                    )}
                </button>
                <div className="flex flex-col gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleClick}
                    >
                        {avatarBase64 ? "Change" : "Upload"}
                    </Button>
                    {avatarBase64 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRemove}
                            className="text-muted-foreground"
                        >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                        </Button>
                    )}
                </div>
            </div>

            {/* Cropper dialog */}
            {selectedImage && (
                <ImageCropperDialog
                    open={cropperOpen}
                    onOpenChange={handleCropperClose}
                    imageSrc={selectedImage}
                    onCropComplete={handleCropComplete}
                />
            )}
        </>
    );
}
