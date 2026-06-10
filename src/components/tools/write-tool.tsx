"use client";

import { Fragment, memo, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bold,
  Check,
  Heading2,
  Italic,
  Lightbulb,
  Link2,
  List,
  Loader2,
  MessageSquareQuote,
  Sparkles,
  WandSparkles,
} from "lucide-react";

interface WriteToolProps {
  prompt: string;
  onSubmit: (content: { text: string; wordCount: number; markdown: string }) => void;
  initialContent?: string;
  isSubmitting?: boolean;
  layout?: "compact" | "wide";
}

interface WriteAssistPayload {
  suggestion: string;
  bullets: string[];
  rewrite: string;
  modelUsed: string;
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-slate-200 px-1 py-0.5 text-[12px] dark:bg-slate-800"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-indigo-600 underline underline-offset-2 dark:text-indigo-300"
        >
          {linkMatch[1]}
        </a>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

function renderMarkdownPreview(text: string) {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (!listItems.length) return;
    nodes.push(
      <ul key={`list-${nodes.length}`} className="list-disc space-y-1 pl-5">
        {listItems.map((item, index) => (
          <li key={`${item}-${index}`}>{renderInlineMarkdown(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      nodes.push(<div key={`spacer-${index}`} className="h-2" />);
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();

    if (trimmed.startsWith("## ")) {
      nodes.push(
        <h3 key={`h3-${index}`} className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {renderInlineMarkdown(trimmed.slice(3))}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      nodes.push(
        <h2 key={`h2-${index}`} className="text-xl font-semibold text-slate-900 dark:text-slate-50">
          {renderInlineMarkdown(trimmed.slice(2))}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith("> ")) {
      nodes.push(
        <blockquote
          key={`quote-${index}`}
          className="border-l-2 border-indigo-400 pl-3 italic text-slate-600 dark:text-slate-300"
        >
          {renderInlineMarkdown(trimmed.slice(2))}
        </blockquote>,
      );
      return;
    }

    nodes.push(
      <p key={`p-${index}`} className="leading-7 text-slate-700 dark:text-slate-200">
        {renderInlineMarkdown(trimmed)}
      </p>,
    );
  });

  flushList();
  return nodes;
}

// UNCONTROLLED TEXTAREA strategy:
// Field measurement showed keyboard INP at 2.2s on advanced ventures
// even with Phaser paused. The controlled-component pattern was
// re-rendering WriteTool on every keystroke, and on data-heavy
// ventures that render coincided with batched Convex subscription
// updates from MapPageInner, blocking paint for ~2 seconds.
//
// The fix: let the browser own the textarea value. Each keystroke
// mutates the DOM natively, never enters React. We only:
//   1. update a DEBOUNCED `text` state (200ms) for wordCount /
//      submit-button enable. The user sees the button enable a
//      fraction of a second after they stop typing — imperceptible.
//   2. read the live value via `textareaRef.current.value` on
//      submit and on AI-assist requests.
//
// Result on /feed (no Phaser): typing INP ~40ms. We're matching that.
function WriteToolInner({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
  layout = "wide",
}: WriteToolProps) {
  // `text` is the DEBOUNCED snapshot of the textarea value — used for
  // wordCount / submit-button gating only. NOT bound to the textarea.
  const [text, setText] = useState(initialContent || "");
  const [activeTab, setActiveTab] = useState("editor");
  const [assist, setAssist] = useState<WriteAssistPayload | null>(null);
  const [assistMode, setAssistMode] = useState<
    "outline" | "strengthen" | "sharpen" | null
  >(null);
  const [assistError, setAssistError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const debounceTimerRef = useRef<number | null>(null);

  const generateWriteAssist = useAction(api.aiScoring.generateWriteAssist);

  // Initialize text from saved draft exactly once per mount. Re-running on
  // every initialContent ref change would overwrite the user's edits.
  const initializedRef = useRef(false);
  useEffect(() => {
    if (initializedRef.current) return;
    if (initialContent) {
      setText(initialContent);
      // Also seed the DOM textarea if it's already mounted.
      if (textareaRef.current && !textareaRef.current.value) {
        textareaRef.current.value = initialContent;
      }
      initializedRef.current = true;
    }
  }, [initialContent]);

  // Cleanup any pending debounce on unmount.
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current != null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Debounced sync: every 200ms of idle typing the React state catches
  // up. Submit button enable / disable lags typing by at most 200ms.
  const scheduleTextSync = useCallback(() => {
    if (debounceTimerRef.current != null) {
      window.clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = window.setTimeout(() => {
      debounceTimerRef.current = null;
      const v = textareaRef.current?.value ?? "";
      // Only set state if changed — prevents an unnecessary re-render
      // when the user just types a single space.
      setText((prev) => (prev === v ? prev : v));
    }, 200);
  }, []);

  const wordCount = useMemo(
    () => (text.trim() ? text.trim().split(/\s+/).length : 0),
    [text],
  );
  const meetsRequirement = wordCount >= 50;

  const handleSubmit = () => {
    // Read LIVE value from the DOM, not the debounced state — covers
    // the case where user clicks Submit within 200ms of last keystroke.
    const liveText = textareaRef.current?.value ?? text;
    const liveWordCount = liveText.trim()
      ? liveText.trim().split(/\s+/).length
      : 0;
    if (!liveText.trim() || liveWordCount < 50) return;
    onSubmit({ text: liveText, wordCount: liveWordCount, markdown: liveText });
  };

  const insertAroundSelection = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current
      ?? (document.getElementById("write-response") as HTMLTextAreaElement | null);
    if (!textarea) {
      // Fallback: append to React state.
      setText((current) => `${current}${prefix}${suffix}`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = textarea.value;
    const selected = current.slice(start, end);
    const next = `${current.slice(0, start)}${prefix}${selected}${suffix}${current.slice(end)}`;
    // Write directly to the DOM so we don't trigger a controlled-component
    // round-trip. Then sync React state on the next tick.
    textarea.value = next;
    scheduleTextSync();

    requestAnimationFrame(() => {
      textarea.focus();
      const caret = start + prefix.length + selected.length + suffix.length;
      textarea.setSelectionRange(caret, caret);
    });
  };

  const handleAssist = async (mode: "outline" | "strengthen" | "sharpen") => {
    setAssistMode(mode);
    setAssistError(null);
    try {
      // Use the live DOM value, not debounced state.
      const draft = textareaRef.current?.value ?? text;
      const result = (await generateWriteAssist({
        prompt,
        draft,
        mode,
      })) as WriteAssistPayload;
      setAssist(result);
    } catch (error) {
      setAssistError(error instanceof Error ? error.message : "Assist failed");
    } finally {
      setAssistMode(null);
    }
  };

  return (
    <Card className="border-white/10 bg-[#0f172a]/70 shadow-none">
      <CardHeader className="pb-3">
        <CardTitle>Write Your Response</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Changed grid layout to full-width container because AI Assist is commented out */}
        <div className="w-full">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <Button type="button" variant="outline" size="sm" onClick={() => insertAroundSelection("## ")} className="h-8 px-2 sm:px-3">
                <Heading2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Heading</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertAroundSelection("**", "**")} className="h-8 px-2 sm:px-3">
                <Bold className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Bold</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertAroundSelection("*", "*")} className="h-8 px-2 sm:px-3">
                <Italic className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Italic</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertAroundSelection("- ")} className="h-8 px-2 sm:px-3">
                <List className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">List</span>
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => insertAroundSelection("> ")} className="h-8 px-2 sm:px-3">
                <MessageSquareQuote className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Quote</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => insertAroundSelection("[label](", ")")}
                className="h-8 px-2 sm:px-3"
              >
                <Link2 className="h-4 w-4" />
                <span className="hidden sm:inline ml-1.5">Link</span>
              </Button>
            </div>

            {/* Tabs structure commented out to remove the Preview button/tab and display Editor directly */}
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="write-response">Markdown response</Label>
                {/* UNCONTROLLED textarea — browser owns the value, no
                    React work per keystroke. See WriteToolInner header
                    comment for the rationale (kills 2s INP on old maps).
                    onInput schedules a 200ms-debounced state sync so
                    wordCount / submit-button gating still update. */}
                <Textarea
                  ref={textareaRef}
                  id="write-response"
                  placeholder="Write your response here..."
                  defaultValue={initialContent || ""}
                  onInput={scheduleTextSync}
                  className="h-[200px] resize-none font-mono text-sm xl:h-[220px]"
                />
              </div>
            </div>

            {/* Commented out tabs and preview component for future implementation
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="write-response">Markdown response</Label>
                  <Textarea
                    id="write-response"
                    placeholder="Write your response here..."
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    className="h-[200px] resize-none font-mono text-sm xl:h-[220px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="preview">
                <div className="h-[200px] overflow-y-auto space-y-3 rounded-lg border bg-slate-50 p-4 dark:bg-slate-950 xl:h-[220px]">
                  {text.trim() ? (
                    renderMarkdownPreview(text)
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Your markdown preview will render here.
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            */}

            <div className="flex items-center justify-between gap-3 text-xs">
              <span
                className={
                  meetsRequirement
                    ? "font-medium text-green-600"
                    : "text-muted-foreground"
                }
              >
                {wordCount} / 50 words
              </span>
              {!meetsRequirement && wordCount > 0 && (
                <span className="text-amber-600">
                  {50 - wordCount} more word{50 - wordCount !== 1 ? "s" : ""} needed
                </span>
              )}
              {meetsRequirement && (
                <span className="font-medium text-green-600">Requirement met</span>
              )}
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!text.trim() || wordCount < 50 || isSubmitting}
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
          </div>

            {/* Commented out the entire AI Assist panel for future implementation
            <div className="rounded-lg border bg-slate-50 p-4 dark:bg-slate-950">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    AI Assist
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Generate an outline, strengthen the draft, or tighten the writing.
                  </p>
                </div>
                {assist?.modelUsed && (
                  <Badge variant="outline">{assist.modelUsed}</Badge>
                )}
              </div>

              <div className="mt-4 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-800 p-8 text-center bg-slate-900/20">
                <Sparkles className="h-10 w-10 text-indigo-400/50 mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-slate-200">Coming Soon</p>
                <p className="text-xs text-slate-400 max-w-[220px] mt-2 leading-relaxed">
                  AI Assistant features are currently under development and will be implemented in a future update.
                </p>
              </div>
            </div>
            */}
        </div>
      </CardContent>
    </Card>
  );
}

export const WriteTool = memo(WriteToolInner);
