import * as React from "react";
import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area";

import { cn } from "@/lib/utils";

type ViewportRef =
    | React.RefObject<HTMLDivElement | null>
    | ((node: HTMLDivElement | null) => void);

interface ScrollAreaProps extends ScrollAreaPrimitive.Root.Props {
    viewportRef?: ViewportRef;
    viewportClassName?: string;
    onScroll?: React.UIEventHandler<HTMLDivElement>;
}

function ScrollArea({
    className,
    children,
    viewportRef,
    viewportClassName,
    onScroll,
    ...props
}: ScrollAreaProps) {
    // Handle both RefObject and callback ref
    const handleRef = React.useCallback(
        (node: HTMLDivElement | null) => {
            if (typeof viewportRef === "function") {
                viewportRef(node);
            } else if (viewportRef && "current" in viewportRef) {
                // Use Object.assign to avoid direct mutation lint error
                Object.assign(viewportRef, { current: node });
            }
        },
        [viewportRef]
    );

    return (
        <ScrollAreaPrimitive.Root
            data-slot="scroll-area"
            className={cn("relative overflow-hidden", className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                ref={handleRef}
                data-slot="scroll-area-viewport"
                className={cn(
                    "h-full w-full overflow-y-scroll focus-visible:ring-ring/50 rounded-[inherit] transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:outline-1",
                    viewportClassName
                )}
                onScroll={onScroll}
            >
                {children}
            </ScrollAreaPrimitive.Viewport>
            <ScrollBar />
            <ScrollAreaPrimitive.Corner />
        </ScrollAreaPrimitive.Root>
    );
}

function ScrollBar({
    className,
    orientation = "vertical",
    ...props
}: ScrollAreaPrimitive.Scrollbar.Props) {
    return (
        <ScrollAreaPrimitive.Scrollbar
            data-slot="scroll-area-scrollbar"
            data-orientation={orientation}
            orientation={orientation}
            className={cn(
                "data-horizontal:h-2.5 data-horizontal:flex-col data-horizontal:border-t data-horizontal:border-t-transparent data-vertical:h-full data-vertical:w-2.5 data-vertical:border-l data-vertical:border-l-transparent flex touch-none p-px select-none",
                // Auto-hide: fade in on hover or scroll, fade out otherwise
                "opacity-0 transition-opacity duration-300 data-[hovering]:opacity-100 data-[scrolling]:opacity-100",
                className
            )}
            {...props}
        >
            <ScrollAreaPrimitive.Thumb
                data-slot="scroll-area-thumb"
                className="rounded-full bg-border relative flex-1"
            />
        </ScrollAreaPrimitive.Scrollbar>
    );
}

export { ScrollArea, ScrollBar };
