"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Loader2, Check, Plus, Trash2 } from "lucide-react"

interface SurveyQuestion {
  id: string
  text: string
  type: "text" | "multiple_choice"
  options?: string[]
}

interface SurveyToolProps {
  prompt: string
  onSubmit: (content: { questions: SurveyQuestion[] }) => void
  initialContent?: { questions: SurveyQuestion[] }
  isSubmitting?: boolean
}

export function SurveyTool({ prompt, onSubmit, initialContent, isSubmitting }: SurveyToolProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    initialContent?.questions || [
      { id: "1", text: "", type: "text" },
    ]
  )

  useEffect(() => {
    if (initialContent?.questions) {
      setQuestions(initialContent.questions)
    }
  }, [initialContent])

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now().toString(), text: "", type: "text" },
    ])
  }

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updates } : q))
    )
  }

  const addOption = (questionId: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: [...(q.options || []), ""] }
          : q
      )
    )
  }

  const updateOption = (questionId: string, index: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: (q.options || []).map((opt, i) =>
                i === index ? value : opt
              ),
            }
          : q
      )
    )
  }

  const removeOption = (questionId: string, index: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: (q.options || []).filter((_, i) => i !== index) }
          : q
      )
    )
  }

  const handleSubmit = () => {
    const allFilled = questions.every((q) => q.text.trim())
    const allOptionsFilled = questions.every(
      (q) =>
        q.type !== "multiple_choice" ||
        (q.options && q.options.length >= 2 && q.options.every((o) => o.trim()))
    )
    if (!allFilled || !allOptionsFilled) return
    onSubmit({ questions })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Build Your Survey</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((question, qIndex) => (
          <div key={question.id} className="p-4 rounded-lg border space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Question {qIndex + 1}</Label>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeQuestion(question.id)}
                disabled={questions.length <= 1}
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <Input
              placeholder="Enter your question..."
              value={question.text}
              onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
            />
            <RadioGroup
              value={question.type}
              onValueChange={(value: "text" | "multiple_choice") =>
                updateQuestion(question.id, {
                  type: value,
                  options: value === "multiple_choice" ? ["", ""] : undefined,
                })
              }
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="text" id={`type-text-${question.id}`} />
                <Label htmlFor={`type-text-${question.id}`} className="text-xs">
                  Text response
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="multiple_choice" id={`type-mc-${question.id}`} />
                <Label htmlFor={`type-mc-${question.id}`} className="text-xs">
                  Multiple choice
                </Label>
              </div>
            </RadioGroup>
            {question.type === "multiple_choice" && (
              <div className="space-y-2 ml-4">
                {(question.options || []).map((option, oIndex) => (
                  <div key={oIndex} className="flex items-center gap-2">
                    <Input
                      placeholder={`Option ${oIndex + 1}`}
                      value={option}
                      onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                      className="text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeOption(question.id, oIndex)}
                      disabled={(question.options?.length || 0) <= 2}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addOption(question.id)}
                  className="text-xs"
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add Option
                </Button>
              </div>
            )}
          </div>
        ))}

        <Button variant="outline" onClick={addQuestion} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Question
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !questions.every((q) => q.text.trim())}
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
              Submit Survey
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
