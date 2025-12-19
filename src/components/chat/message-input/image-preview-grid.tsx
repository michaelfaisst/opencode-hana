import { X } from "lucide-react";
import type { ImageAttachment } from "@/hooks/use-messages";

interface ImagePreviewGridProps {
  images: ImageAttachment[];
  onRemove: (id: string) => void;
  onImageClick: (image: ImageAttachment) => void;
}

export function ImagePreviewGrid({ images, onRemove, onImageClick }: ImagePreviewGridProps) {
  if (images.length === 0) return null;

  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {images.map((image) => (
        <div key={image.id} className="relative group rounded-md overflow-hidden border bg-muted">
          <button
            type="button"
            onClick={() => onImageClick(image)}
            className="block cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <img src={image.dataUrl} alt={image.file.name} className="h-20 w-20 object-cover" />
          </button>
          <button
            onClick={() => onRemove(image.id)}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-1 py-0.5 pointer-events-none">
            <span className="text-[10px] text-muted-foreground truncate block">
              {image.file.name}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
