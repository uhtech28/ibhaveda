"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, ExternalLink } from "lucide-react"

interface OAuthToolProps {
  prompt: string
  onSubmit: (content: { provider: string; externalUrl: string }) => void
  initialContent?: { provider: string; externalUrl: string }
  isSubmitting?: boolean
}

const PROVIDERS = [
  "Figma",
  "Google Docs",
  "Notion",
  "Miro",
  "Trello",
  "GitHub",
  "Vercel",
  "Other",
]

export function OAuthTool({ prompt, onSubmit, initialContent, isSubmitting }: OAuthToolProps) {
  const [provider, setProvider] = useState(initialContent?.provider || "")
  const [externalUrl, setExternalUrl] = useState(initialContent?.externalUrl || "")

  const isValidUrl = (str: string) => {
    try {
      new URL(str)
      return true
    } catch {
      return false
    }
  }

  const handleSubmit = () => {
    if (!provider || !externalUrl.trim() || !isValidUrl(externalUrl)) return
    onSubmit({ provider, externalUrl })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="h-5 w-5" />
          Link External Tool
        </CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="oauth-provider">Tool / Provider</Label>
          <div className="flex flex-wrap gap-2">
            {PROVIDERS.map((p) => (
              <Button
                key={p}
                variant={provider === p ? "default" : "outline"}
                size="sm"
                onClick={() => setProvider(p)}
                className="text-xs"
              >
                {p}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="oauth-url">External URL</Label>
          <Input
            id="oauth-url"
            type="url"
            placeholder="https://figma.com/file/..."
            value={externalUrl}
            onChange={(e) => setExternalUrl(e.target.value)}
          />
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!provider || !externalUrl.trim() || !isValidUrl(externalUrl) || isSubmitting}
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
