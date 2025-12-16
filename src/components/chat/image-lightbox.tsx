import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageLightboxProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  src: string;
  alt?: string;
}

export function ImageLightbox({
  open,
  onOpenChange,
  src,
  alt = "Image",
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="!max-w-[90vw] !w-auto !p-0 !bg-transparent !ring-0 !shadow-none overflow-hidden sm:!max-w-[90vw]"
        showCloseButton={false}
      >
        <div className="relative flex items-center justify-center">
          {/* Close button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          {/* Full-size image */}
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
