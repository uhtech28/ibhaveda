"use client"

import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Check, Loader2, Radio } from "lucide-react"

interface FlareButtonProps {
  ventureId?: string
  checkpointId?: string
}

export function FlareButton({ ventureId, checkpointId }: FlareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fireFlare = useMutation(api.flares.fireFlare)

  const handleSubmit = async () => {
    if (!description.trim()) return
    setSubmitting(true)
    try {
      await fireFlare({
        description,
        ventureId: ventureId as any,
        checkpointId: checkpointId as any,
      })
      setDescription("")
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to fire flare:", error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Radio className="h-4 w-4" />
        Fire a Flare
      </Button>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-5 w-5 text-amber-500" />
          Fire a Flare
        </CardTitle>
        <CardDescription>
          Ask the community for help when you're stuck
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="What do you need help with? Be specific about your challenge..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
        />
        <div className="flex items-center gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!description.trim() || submitting}
            size="sm"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                Firing...
              </>
            ) : (
              <>
                <Send className="mr-1 h-4 w-4" />
                Fire Flare
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsOpen(false)
              setDescription("")
            }}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function FlareFeed() {
  const flares = useQuery(api.flares.getOpenFlares, { limit: 10 })
  const respondToFlare = useMutation(api.flares.respondToFlare)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState("")

  const handleRespond = async (flareId: string) => {
    if (!responseText.trim()) return
    try {
      await respondToFlare({
        flareId: flareId as any,
        content: responseText,
      })
      setResponseText("")
      setRespondingTo(null)
    } catch (error) {
      console.error("Failed to respond:", error)
    }
  }

  if (!flares) {
    return <div className="animate-pulse text-muted-foreground">Loading flares...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-amber-500" />
          Open Flares
        </CardTitle>
        <CardDescription>
          Help fellow builders who are stuck
        </CardDescription>
      </CardHeader>
      <CardContent>
        {flares.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No open flares. Everyone's making progress!
          </p>
        ) : (
          <div className="space-y-3">
            {flares.map((flare) => (
              <div key={flare._id} className="p-3 rounded-lg border">
                <p className="text-sm">{flare.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <Badge variant="outline" className="text-xs">
                    Open
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setRespondingTo(respondingTo === flare._id ? null : flare._id)
                    }
                  >
                    Respond
                  </Button>
                </div>
                {respondingTo === flare._id && (
                  <div className="mt-3 space-y-2">
                    <Textarea
                      placeholder="Share your advice..."
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      className="min-h-[80px]"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleRespond(flare._id)}
                        disabled={!responseText.trim()}
                      >
                        <Check className="mr-1 h-4 w-4" />
                        Submit Response
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRespondingTo(null)
                          setResponseText("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
