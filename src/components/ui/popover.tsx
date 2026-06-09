"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const PopoverCloseContext = React.createContext<(() => void) | null>(null)

function Popover({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  const closePopover = React.useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

  return (
    <PopoverCloseContext.Provider value={onOpenChange ? closePopover : null}>
      <PopoverPrimitive.Root data-slot="popover" onOpenChange={onOpenChange} {...props} />
    </PopoverCloseContext.Provider>
  )
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  onPointerDown,
  onClick,
  onPointerDownOutside,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  const closePopover = React.useContext(PopoverCloseContext)

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        onPointerDown={(event) => {
          onPointerDown?.(event)
          if (!event.defaultPrevented) event.stopPropagation()
        }}
        onClick={(event) => {
          onClick?.(event)
          if (!event.defaultPrevented) event.stopPropagation()
        }}
        onPointerDownOutside={(event) => {
          onPointerDownOutside?.(event)
          if (event.defaultPrevented) return
          if (closePopover) {
            event.preventDefault()
            closePopover()
          }
        }}
        className={cn(
          // z-[10100] so popovers (multi-select dropdowns, etc.) always
          // render above the dialog layer (z-[9999]/z-[10000]). Without this,
          // opening the Industries/Skills dropdown inside the AI wizard
          // dialog made the options appear behind the dialog content.
          "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-[10100] w-72 origin-(--radix-popover-content-transform-origin) rounded-md border p-4 shadow-md outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
