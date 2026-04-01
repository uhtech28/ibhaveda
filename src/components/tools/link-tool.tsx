"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, Link2 } from "lucide-react"

interface LinkToolProps {
  prompt: string
  onSubmit: (content: { url: string; title: string; note: string }) => void
  initialContent?: { url: string; title: string; note: string }
  isSubmitting?: boolean
}

export function LinkTool({ prompt, onSubmit, initialContent, isSubmitting }: LinkToolProps) {
  const [url, setUrl] = useState(initialContent?.url || "")
  const [title, setTitle] = useState(initialContent?.title || "")
  const [note, setNote] = useState(initialContent?.note || "")

  const isValidUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = () => {
    if (!url.trim() || !isValidUrl(url)) return
    onSubmit({ url, title, note })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Add a Link
        </CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="link-url">URL</Label>
          <Input
            id="link-url"
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-title">Title (optional)</Label>
          <Input
            id="link-title"
            placeholder="What is this link about?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="link-note">Note (optional)</Label>
          <Textarea
            id="link-note"
            placeholder="What does this link show or prove?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!url.trim() || !isValidUrl(url) || isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              Submit Link
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
