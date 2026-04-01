"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2, Check, Plus, Trash2 } from "lucide-react"

interface FieldDef {
  key: string
  label: string
  type: "text" | "textarea" | "number"
}

interface SelfReportToolProps {
  prompt: string
  fields: FieldDef[]
  onSubmit: (content: Record<string, string | number>) => void
  initialContent?: Record<string, string | number>
  isSubmitting?: boolean
}

export function SelfReportTool({ prompt, fields, onSubmit, initialContent, isSubmitting }: SelfReportToolProps) {
  const [values, setValues] = useState<Record<string, string | number>>(
    initialContent || {}
  )

  const handleChange = (key: string, value: string | number) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = () => {
    const allFilled = fields.every((f) => {
      const val = values[f.key]
      return val !== undefined && val !== ""
    })
    if (!allFilled) return
    onSubmit(values)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fill Out the Report</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            {field.type === "textarea" ? (
              <Textarea
                id={field.key}
                placeholder={field.label}
                value={(values[field.key] as string) || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="min-h-[80px]"
              />
            ) : (
              <Input
                id={field.key}
                type={field.type === "number" ? "number" : "text"}
                placeholder={field.label}
                value={(values[field.key] as string) || ""}
                onChange={(e) =>
                  handleChange(
                    field.key,
                    field.type === "number" ? Number(e.target.value) : e.target.value
                  )
                }
              />
            )}
          </div>
        ))}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
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
              Submit Report
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
