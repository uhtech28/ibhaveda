"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type AlertProps = React.ComponentProps<"div"> & {
  variant?: "default" | "destructive" | "success" | "info" | "warning"
}

function Alert({ className, variant = "default", ...props }: AlertProps) {
  const variants: Record<string, string> = {
    default: "bg-card border border-border text-foreground",
    destructive: "bg-destructive/10 border border-destructive/20 text-destructive-foreground",
    success: "bg-green-500/10 border border-green-500/20 text-foreground",
    info: "bg-blue-500/10 border border-blue-500/20 text-foreground",
    warning: "bg-amber-500/10 border border-amber-500/20 text-foreground",
  }
  return (
    <div
      role="alert"
      className={cn("rounded-xl p-4", variants[variant] || variants.default, className)}
      {...props}
    />
  )
}

function AlertContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-start gap-3", className)} {...props} />
}

function AlertIcon({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("shrink-0 mt-0.5", className)} {...props} />
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm font-semibold", className)} {...props} />
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-sm text-muted-foreground space-y-1", className)} {...props} />
}

export { Alert, AlertContent, AlertDescription, AlertIcon, AlertTitle }

