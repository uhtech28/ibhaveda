"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

const DialogCloseContext = React.createContext<(() => void) | null>(null)

function Dialog({
  onOpenChange,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const closeDialog = React.useCallback(() => {
    onOpenChange?.(false)
  }, [onOpenChange])

  return (
    <DialogCloseContext.Provider value={onOpenChange ? closeDialog : null}>
      <DialogPrimitive.Root data-slot="dialog" onOpenChange={onOpenChange} {...props} />
    </DialogCloseContext.Provider>
  )
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  onPointerDown,
  onClick,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      data-slot="dialog-overlay"
      onPointerDown={(event) => {
        onPointerDown?.(event)
        if (event.defaultPrevented) return
        event.preventDefault()
        event.stopPropagation()
      }}
      onClick={(event) => {
        onClick?.(event)
        if (event.defaultPrevented) return
        event.preventDefault()
        event.stopPropagation()
      }}
      className={cn(
        // z-[9999] so dialogs always render above all panels, bottom navs (z-50) and game map tools (z-[100])
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-[9999] bg-black/50",
        className
      )}
      {...props}
    />
  )
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  onPointerDown,
  onClick,
  onPointerDownOutside,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & {
  showCloseButton?: boolean
}) {
  // Radix requires every DialogContent to contain a DialogTitle for
  // screen-reader accessibility. Callers that provide their own custom
  // header (most of ours do) don't include a raw DialogTitle, which
  // triggers the dev-mode warning + a11y regression.
  //
  // Auto-detect whether the caller included a DialogTitle anywhere in
  // `children`. If not, inject a visually-hidden default so the a11y
  // API always has something to announce, without touching any visible
  // UI. Custom titles from callers are respected — this only fills
  // the gap for dialogs that never had one.
  const hasTitle = React.Children.toArray(children).some((child) => {
    if (!React.isValidElement(child)) return false
    // Match either the direct DialogTitle primitive OR our re-exported
    // DialogTitle wrapper (both share the same displayName from Radix).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = (child.type as any)?.displayName ?? (child.type as any)?.name
    return typeof t === "string" && t.includes("DialogTitle")
  })

  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay />
      <DialogPrimitive.Content
        data-slot="dialog-content"
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
          event.preventDefault()
        }}
        onInteractOutside={(event) => {
          onInteractOutside?.(event)
          if (event.defaultPrevented) return
          event.preventDefault()
        }}
        className={cn(
          // z-[10000] sits one above the overlay (z-[9999]) so the dialog
          // body always paints over its own backdrop.
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] z-[10000] grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg duration-200 sm:max-w-lg",
          className
        )}
        {...props}
      >
        {!hasTitle && (
          // sr-only default title — invisible to sighted users, satisfies
          // Radix's a11y requirement + screen-reader consumers get a
          // sensible announcement ("Dialog") even when the caller forgot.
          <DialogPrimitive.Title className="sr-only">
            Dialog
          </DialogPrimitive.Title>
        )}
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className="ring-offset-background focus:ring-ring data-[state=open]:bg-accent data-[state=open]:text-muted-foreground absolute top-4 right-4 rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  )
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
