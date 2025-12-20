import { useState, useCallback } from "react";
import Cropper, { type Area } from "react-easy-crop";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface ImageCropperDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedImageBase64: string) => void;
}

const OUTPUT_SIZE = 200;
const JPEG_QUALITY = 0.9;

async function getCroppedImage(
    imageSrc: string,
    pixelCrop: Area
): Promise<string> {
    const image = new Image();
    image.src = imageSrc;

    await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
        throw new Error("Could not get canvas context");
    }

    // Set canvas size to our desired output size
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    // Draw the cropped image scaled to output size
    ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
    );

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
}

export function ImageCropperDialog({
    open,
    onOpenChange,
    imageSrc,
    onCropComplete
}: ImageCropperDialogProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(
        null
    );
    const [isProcessing, setIsProcessing] = useState(false);

    const handleCropComplete = useCallback(
        (_croppedArea: Area, croppedAreaPixels: Area) => {
            setCroppedAreaPixels(croppedAreaPixels);
        },
        []
    );

    const handleSave = useCallback(async () => {
        if (!croppedAreaPixels) return;

        setIsProcessing(true);
        try {
            const croppedImage = await getCroppedImage(
                imageSrc,
                croppedAreaPixels
            );
            onCropComplete(croppedImage);
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to crop image:", error);
        } finally {
            setIsProcessing(false);
        }
    }, [croppedAreaPixels, imageSrc, onCropComplete, onOpenChange]);

    const handleCancel = useCallback(() => {
        onOpenChange(false);
    }, [onOpenChange]);

    // Reset state when dialog opens
    const handleOpenChange = useCallback(
        (open: boolean) => {
            if (open) {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setCroppedAreaPixels(null);
            }
            onOpenChange(open);
        },
        [onOpenChange]
    );

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop Avatar</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Cropper container */}
                    <div className="relative h-64 w-full bg-muted rounded-lg overflow-hidden">
                        <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={false}
                            onCropChange={setCrop}
                            onCropComplete={handleCropComplete}
                            onZoomChange={setZoom}
                        />
                    </div>

                    {/* Zoom slider */}
                    <div className="space-y-2">
                        <Label htmlFor="zoom-slider">Zoom</Label>
                        <input
                            id="zoom-slider"
                            type="range"
                            min={1}
                            max={3}
                            step={0.1}
                            value={zoom}
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full accent-primary"
                        />
                    </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose
                        render={
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                            />
                        }
                    >
                        Cancel
                    </DialogClose>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={isProcessing || !croppedAreaPixels}
                    >
                        {isProcessing ? "Saving..." : "Save"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
