"use client"

import { useEffect } from "react"
import { useParams, useRouter } from "next/navigation"

export default function VenturePage() {
  const params = useParams()
  const router = useRouter()
  
  useEffect(() => {
    if (params.id) {
      router.replace(`/map/world?ventureId=${params.id}`)
    }
  }, [params.id, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm font-medium">Entering World Map...</p>
      </div>
    </div>
  )
}
