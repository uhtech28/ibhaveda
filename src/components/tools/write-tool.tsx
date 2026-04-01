"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check } from "lucide-react"

interface WriteToolProps {
  prompt: string
  onSubmit: (content: { text: string; wordCount: number }) => void
  initialContent?: string
  isSubmitting?: boolean
}

export function WriteTool({ prompt, onSubmit, initialContent, isSubmitting }: WriteToolProps) {
  const [text, setText] = useState(initialContent || "")
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0

  const handleSubmit = () => {
    if (!text.trim()) return
    onSubmit({ text, wordCount })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write Your Response</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="write-response">Your response</Label>
          <Textarea
            id="write-response"
            placeholder="Write your response here..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[200px] resize-y"
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{wordCount} words</span>
            <span>Minimum 30 words recommended</span>
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={!text.trim() || isSubmitting}
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
              Submit Response
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
