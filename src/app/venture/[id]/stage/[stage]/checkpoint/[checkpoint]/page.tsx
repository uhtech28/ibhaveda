"use client"

import { Suspense } from "react"
import { VentureErrorBoundary } from "@/components/venture/error-boundary"
import CheckpointPageContent from "./page-content"

export default function CheckpointPage() {
  return (
    <VentureErrorBoundary
      title="Failed to load checkpoint"
      description="This checkpoint may not exist or you don't have access."
    >
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-pulse text-muted-foreground">Loading checkpoint...</div></div>}>
        <CheckpointPageContent />
      </Suspense>
    </VentureErrorBoundary>
  )
}
