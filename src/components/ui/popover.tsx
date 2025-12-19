import * as React from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

import { cn } from "@/lib/utils";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

function PopoverClose({ ...props }: PopoverPrimitive.Close.Props) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}

function PopoverContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: PopoverPrimitive.Popup.Props &
  Pick<PopoverPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "bg-background text-foreground border border-border rounded-md shadow-md p-4",
            "data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
            "data-[closed]:animate-out data-[closed]:fade-out-0 data-[closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2",
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            "z-50 w-72 origin-(--transform-origin)",
            className
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverArrow({
  className,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Arrow>) {
  return (
    <PopoverPrimitive.Arrow
      data-slot="popover-arrow"
      className={cn(
        "size-2.5 bg-background z-50",
        "data-[side=bottom]:rotate-45 data-[side=bottom]:border-l data-[side=bottom]:border-t data-[side=bottom]:border-border data-[side=bottom]:-top-[5px]",
        "data-[side=top]:rotate-45 data-[side=top]:border-r data-[side=top]:border-b data-[side=top]:border-border data-[side=top]:-bottom-[5px]",
        "data-[side=left]:rotate-45 data-[side=left]:border-t data-[side=left]:border-r data-[side=left]:border-border data-[side=left]:-right-[5px]",
        "data-[side=right]:rotate-45 data-[side=right]:border-b data-[side=right]:border-l data-[side=right]:border-border data-[side=right]:-left-[5px]",
        className
      )}
      {...props}
    />
  );
}

export { Popover, PopoverTrigger, PopoverClose, PopoverContent, PopoverArrow };
