import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

import { cn } from "@/lib/utils";

function TooltipProvider({ delay = 300, ...props }: TooltipPrimitive.Provider.Props) {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" delay={delay} {...props} />;
}

function Tooltip({ ...props }: TooltipPrimitive.Root.Props) {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<TooltipPrimitive.Positioner.Props, "align" | "alignOffset" | "side" | "sideOffset">) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          className={cn(
            "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 rounded-none px-3 py-1.5 text-xs bg-background text-foreground border border-border z-50 w-fit max-w-xs origin-(--transform-origin)",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow
            className={cn(
              "size-2.5 bg-background z-50",
              // Bottom: arrow points up (top-left borders)
              "data-[side=bottom]:rotate-45 data-[side=bottom]:border-l data-[side=bottom]:border-t data-[side=bottom]:border-border data-[side=bottom]:-top-[5px]",
              // Top: arrow points down (bottom-right borders)
              "data-[side=top]:rotate-45 data-[side=top]:border-r data-[side=top]:border-b data-[side=top]:border-border data-[side=top]:-bottom-[5px]",
              // Left: arrow points right (top-right borders)
              "data-[side=left]:rotate-45 data-[side=left]:border-t data-[side=left]:border-r data-[side=left]:border-border data-[side=left]:-right-[5px]",
              // Right: arrow points left (bottom-left borders)
              "data-[side=right]:rotate-45 data-[side=right]:border-b data-[side=right]:border-l data-[side=right]:border-border data-[side=right]:-left-[5px]"
            )}
          />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
