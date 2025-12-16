import { useState } from "react";
import { FileCode } from "lucide-react";
import { ImageLightbox } from "../image-lightbox";
import type { FilePart } from "./types";

interface FileDisplayProps {
  part: FilePart;
}

export function FileDisplay({ part }: FileDisplayProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const isImage = part.mime?.startsWith("image/");

  // For images, show a clickable thumbnail with lightbox
  if (isImage && part.url) {
    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="group relative block max-w-xs cursor-pointer overflow-hidden rounded-md border border-border bg-muted/50 transition-all hover:border-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          <img
            src={part.url}
            alt={part.filename || "Image"}
            className="max-h-48 w-auto object-contain"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10">
            <span className="sr-only">View full image</span>
          </div>
        </button>

        {/* Image Lightbox */}
        <ImageLightbox
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          src={part.url}
          alt={part.filename || "Image"}
        />
      </>
    );
  }

  // For non-image files, show file info
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <FileCode className="h-3 w-3" />
      <span className="font-mono">{part.filename || "File"}</span>
      {part.mime && (
        <span className="text-muted-foreground/60">({part.mime})</span>
      )}
    </div>
  );
}
