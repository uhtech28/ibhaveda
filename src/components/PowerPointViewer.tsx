"use client"

import React from "react"

type Props = {
  url: string
  fileName?: string
  className?: string
}

export default function PowerPointViewer({ url, fileName, className }: Props) {
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState("")

  React.useEffect(() => {
    let alive = true
    const check = async () => {
      setLoading(true)
      setError("")
      try {
        const resp = await fetch(url, { method: "HEAD" })
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
      } catch (e: unknown) {
        if (alive) setError(e instanceof Error ? e.message : "Failed to load PowerPoint file")
      } finally {
        if (alive) setLoading(false)
      }
    }
    check()
    return () => { alive = false }
  }, [url])

  const officeSrc = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`

  return (
    <div className={"w-full max-w-full" + (className ? ` ${className}` : "")}>      
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs" aria-label="PowerPoint name">{fileName || "PowerPoint"}</span>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs underline"
          aria-label="Open PowerPoint in new tab"
        >Open</a>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-4" aria-live="polite">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2"></div>
          <span className="ml-2 text-xs">Loading…</span>
        </div>
      )}
      {error && (
        <div className="p-3 text-xs text-destructive">{error}</div>
      )}

      {!error && (
        <div className="w-full h-[70vh] rounded-md border overflow-hidden">
          <iframe
            src={officeSrc}
            title={fileName || "PowerPoint"}
            className="w-full h-full"
          />
        </div>
      )}
    </div>
  )
}

