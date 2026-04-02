"use client"

import { useState } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@convex/_generated/api"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Check, X, Star, FileText, Table2, Map, Link2, Upload, ExternalLink, HelpCircle } from "lucide-react"
import { CHECKPOINT_DEFINITIONS, VENTURE_STAGES } from "@convex/ventureConstants"
import { WriteTool } from "@/components/tools/write-tool"
import { TableTool } from "@/components/tools/table-tool"
import { LinkTool } from "@/components/tools/link-tool"
import { UploadTool } from "@/components/tools/upload-tool"
import { SelfReportTool } from "@/components/tools/self-report-tool"
import { MapTool } from "@/components/tools/map-tool"
import { SurveyTool } from "@/components/tools/survey-tool"
import { PollTool } from "@/components/tools/poll-tool"
import { OAuthTool } from "@/components/tools/oauth-tool"

const TOOL_ICONS: Record<string, any> = {
  write: FileText,
  table: Table2,
  map: Map,
  link: Link2,
  upload: Upload,
  oauth: ExternalLink,
  survey: HelpCircle,
  poll: HelpCircle,
  self_report: HelpCircle,
}

export default function CheckpointPage() {
  const params = useParams()
  const router = useRouter()
  const ventureId = params.id as string
  const stageNum = parseInt(params.stage as string)
  const checkpointNum = parseInt(params.checkpoint as string)

  const [activeTask, setActiveTask] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const venture = useQuery(api.ventures.getVenture, { ventureId: ventureId as any })
  const submitEvidence = useMutation(api.ventures.submitEvidence)
  const advanceCheckpoint = useMutation(api.ventures.advanceCheckpoint)
  const startCheckpoint = useMutation(api.ventures.startCheckpoint)
  const [advancing, setAdvancing] = useState(false)

  const checkpoint = venture?.checkpoints?.find(
    (cp: any) => cp.stage === stageNum && cp.checkpoint === checkpointNum
  )

  const cpDef = CHECKPOINT_DEFINITIONS.find(
    (d) => d.stage === stageNum && d.checkpoint === checkpointNum
  )

  if (!venture || !checkpoint || !cpDef) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading checkpoint...</div>
      </div>
    )
  }

  const completedCount = [checkpoint.t1Completed, checkpoint.t2Completed, checkpoint.t3Completed]
    .filter(Boolean).length
  const canAdvance = completedCount >= 2

  const handleSubmitEvidence = async (taskId: string, toolType: string, content: any) => {
    setSubmitting(true)
    try {
      await submitEvidence({ taskId: taskId as any, content })
      setActiveTask(null)
    } catch (error) {
      console.error("Failed to submit evidence:", error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdvance = async () => {
    if (!checkpoint) return
    setAdvancing(true)
    try {
      await advanceCheckpoint({ checkpointId: checkpoint._id })
      // Navigate to next checkpoint after advancing
      const nextCp = venture.checkpoints?.find(
        (cp: any) => cp.stage === stageNum && cp.checkpoint === checkpointNum + 1
      )
      if (nextCp) {
        router.push(`/venture/${ventureId}/stage/${stageNum}/checkpoint/${checkpointNum + 1}`)
      } else {
        const nextStage = venture.checkpoints?.find(
          (cp: any) => cp.stage === stageNum + 1 && cp.checkpoint === 1
        )
        if (nextStage) {
          router.push(`/venture/${ventureId}/stage/${stageNum + 1}/checkpoint/1`)
        } else {
          router.push(`/venture/${ventureId}`)
        }
      }
    } catch (error) {
      console.error("Failed to advance checkpoint:", error)
    } finally {
      setAdvancing(false)
    }
  }

  const handleStart = async () => {
    if (!checkpoint) return
    try {
      await startCheckpoint({ checkpointId: checkpoint._id })
    } catch (error) {
      console.error("Failed to start checkpoint:", error)
    }
  }

  const renderTool = (task: any, def: { prompt: string; tool: string }) => {
    const props = {
      prompt: def.prompt,
      onSubmit: (content: any) => handleSubmitEvidence(task._id, def.tool, content),
      initialContent: task?.evidence?.content,
      isSubmitting: submitting,
    }

    switch (def.tool) {
      case "write": return <WriteTool {...props} />
      case "table": return <TableTool {...props} />
      case "link": return <LinkTool {...props} />
      case "upload": return <UploadTool {...props} taskId={task._id} />
      case "map": return <MapTool {...props} />
      case "survey": return <SurveyTool {...props} />
      case "poll": return <PollTool {...props} />
      case "oauth": return <OAuthTool {...props} />
      case "self_report": return <SelfReportTool {...props} fields={[]} />
      default: return <WriteTool {...props} />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.push(`/venture/${ventureId}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="text-sm text-muted-foreground">
              Stage {stageNum}: {VENTURE_STAGES.find(s => s.id === stageNum)?.name}
            </div>
            <h1 className="text-2xl font-bold">{cpDef.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{cpDef.outcome}</p>
          </div>
          <Badge variant={checkpoint.status === "completed" ? "default" : "secondary"}>
            {checkpoint.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Tasks Completed</span>
              <span className="text-sm font-medium">{completedCount}/3</span>
            </div>
            <Progress value={(completedCount / 3) * 100} className="h-2" />
            {checkpoint.goldBonusEarned && (
              <div className="flex items-center gap-1 mt-2 text-yellow-500">
                <Star className="h-4 w-4 fill-current" />
                <span className="text-sm font-medium">Gold Bonus Earned!</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <div className="space-y-6">
          {[
            { task: checkpoint.tasks?.find((t: any) => t.taskLevel === "t1"), def: cpDef.t1, level: "t1", label: "Task 1 — Easy", desc: "20% points" },
            { task: checkpoint.tasks?.find((t: any) => t.taskLevel === "t2"), def: cpDef.t2, level: "t2", label: "Task 2 — Medium", desc: "20% points" },
            { task: checkpoint.tasks?.find((t: any) => t.taskLevel === "t3"), def: cpDef.t3, level: "t3", label: "Task 3 — Stretch", desc: "35% points" },
          ].map(({ task, def, level, label, desc }) => (
            <TaskCard
              key={level}
              task={task}
              def={def}
              level={level}
              label={label}
              description={desc}
              isActive={activeTask === task?._id}
              onActivate={() => task && setActiveTask(task._id)}
              onClose={() => setActiveTask(null)}
              renderTool={() => task ? renderTool(task, def) : null}
              checkpointStatus={checkpoint.status}
              onStartCheckpoint={handleStart}
            />
          ))}
        </div>

        {/* Advance Button */}
        {canAdvance && checkpoint.status !== "completed" && (
          <div className="mt-8 flex justify-center">
            <Button size="lg" className="gap-2" onClick={handleAdvance} disabled={advancing}>
              {advancing ? (
                <>
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Advancing...
                </>
              ) : (
                <>
                  <Check className="h-5 w-5" />
                  Advance to Next Checkpoint
                </>
              )}
            </Button>
          </div>
        )}

        {checkpoint.status === "completed" && (
          <div className="mt-8 flex justify-center">
            <Button
              size="lg"
              variant="outline"
              onClick={() => {
                const nextCp = venture.checkpoints?.find(
                  (cp: any) => cp.stage === stageNum && cp.checkpoint === checkpointNum + 1
                )
                if (nextCp) {
                  router.push(`/venture/${ventureId}/stage/${stageNum}/checkpoint/${checkpointNum + 1}`)
                } else {
                  const nextStage = venture.checkpoints?.find(
                    (cp: any) => cp.stage === stageNum + 1 && cp.checkpoint === 1
                  )
                  if (nextStage) {
                    router.push(`/venture/${ventureId}/stage/${stageNum + 1}/checkpoint/1`)
                  } else {
                    router.push(`/venture/${ventureId}`)
                  }
                }
              }}
            >
              Continue to Next Checkpoint
              <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function TaskCard({
  task,
  def,
  level,
  label,
  description,
  isActive,
  onActivate,
  onClose,
  renderTool,
  checkpointStatus,
  onStartCheckpoint,
}: {
  task: any
  def: { prompt: string; tool: string }
  level: string
  label: string
  description: string
  isActive: boolean
  onActivate: () => void
  onClose: () => void
  renderTool: () => React.ReactNode
  checkpointStatus: string
  onStartCheckpoint: () => void
}) {
  const isComplete = task?.status === "completed"
  const Icon = TOOL_ICONS[def.tool] || FileText

  const levelColors: Record<string, string> = {
    t1: "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20",
    t2: "border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20",
    t3: "border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20",
  }

  return (
    <Card className={levelColors[level]}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            <CardTitle className="text-lg">{label}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{description}</Badge>
            {isComplete ? (
              <Badge variant="default"><Check className="h-3 w-3 mr-1" /> Done</Badge>
            ) : (
              <Badge variant="secondary"><X className="h-3 w-3 mr-1" /> Pending</Badge>
            )}
          </div>
        </div>
        <CardDescription className="text-sm mt-2">{def.prompt}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Tool:</span>
          <Badge variant="outline" className="capitalize">{def.tool}</Badge>
        </div>
        {!isComplete && !isActive && (
          <Button className="mt-4" size="sm" onClick={onActivate}>
            Start Task
          </Button>
        )}
        {checkpointStatus === "not_started" && (
          <Button className="mt-2" variant="outline" size="sm" onClick={onStartCheckpoint}>
            Start This Checkpoint
          </Button>
        )}
        {!isComplete && isActive && (
          <div className="mt-4 space-y-3">
            {renderTool()}
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          </div>
        )}
        {isComplete && task?.evidence && (
          <div className="mt-4 p-3 rounded bg-background border text-sm">
            <p className="text-muted-foreground text-xs mb-1">Evidence submitted:</p>
            <pre className="whitespace-pre-wrap text-xs">
              {typeof task.evidence.content === "string"
                ? task.evidence.content
                : JSON.stringify(task.evidence.content, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
