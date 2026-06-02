"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Megaphone, Plus, Trash2 } from "lucide-react";

interface PollResult {
  option: string;
  votes: number;
}

interface PollContent {
  question: string;
  options: string[];
  published: boolean;
  audience: string;
  expiresInHours: number;
  broadcastMessage: string;
  results: PollResult[];
}

interface PollToolProps {
  prompt: string;
  onSubmit: (content: PollContent) => void;
  initialContent?: PollContent;
  isSubmitting?: boolean;
}

export function PollTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
}: PollToolProps) {
  const [question, setQuestion] = useState(initialContent?.question || "");
  const [options, setOptions] = useState<string[]>(initialContent?.options || ["", ""]);
  const [audience, setAudience] = useState(initialContent?.audience || "Community");
  const [expiresInHours, setExpiresInHours] = useState(
    initialContent?.expiresInHours || 72,
  );
  const [broadcastMessage, setBroadcastMessage] = useState(
    initialContent?.broadcastMessage || "",
  );
  const [published, setPublished] = useState(initialContent?.published || false);
  const [results, setResults] = useState<PollResult[]>(
    initialContent?.results ||
      (initialContent?.options || ["", ""]).map((option) => ({
        option,
        votes: 0,
      })),
  );

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (!initialContent || hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    setQuestion(initialContent.question || "");
    setOptions(initialContent.options || ["", ""]);
    setAudience(initialContent.audience || "Community");
    setExpiresInHours(initialContent.expiresInHours || 72);
    setBroadcastMessage(initialContent.broadcastMessage || "");
    setPublished(initialContent.published || false);
    setResults(
      initialContent.results ||
        (initialContent.options || ["", ""]).map((option) => ({
          option,
          votes: 0,
        })),
    );
  }, [initialContent]);

  const syncResults = (nextOptions: string[]) => {
    setResults((current) =>
      nextOptions.map((option, index) => {
        const existing = current[index];
        return {
          option,
          votes: existing?.votes || 0,
        };
      }),
    );
  };

  const addOption = () => {
    if (options.length >= 4) return;
    const nextOptions = [...options, ""];
    setOptions(nextOptions);
    syncResults(nextOptions);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const nextOptions = options.filter((_option, optionIndex) => optionIndex !== index);
    setOptions(nextOptions);
    syncResults(nextOptions);
  };

  const updateOption = (index: number, value: string) => {
    const nextOptions = options.map((option, optionIndex) =>
      optionIndex === index ? value : option,
    );
    setOptions(nextOptions);
  };

  const changeVotes = (index: number, delta: number) => {
    setResults((current) =>
      current.map((result, resultIndex) =>
        resultIndex === index
          ? { ...result, option: options[index], votes: Math.max(0, result.votes + delta) }
          : { ...result, option: options[resultIndex] || "" },
      ),
    );
  };

  const totalVotes = useMemo(
    () => results.reduce((sum, result) => sum + result.votes, 0),
    [results],
  );

  const handlePublishToggle = () => {
    setPublished((current) => !current);
  };

  const handleSubmit = () => {
    if (!question.trim() || options.some((option) => !option.trim()) || !published) {
      return;
    }

    onSubmit({
      question,
      options,
      published,
      audience,
      expiresInHours,
      broadcastMessage,
      results: results.map((result, index) => ({
        option: options[index],
        votes: result.votes,
      })),
    });
  };

  // Find the highest vote counts for preview highlight
  const maxVotes = useMemo(() => {
    const counts = results.map((r) => r.votes);
    return Math.max(...counts);
  }, [results]);

  return (
    <Card className="border-0 bg-transparent shadow-none">
      <CardHeader className="hidden">
        <CardTitle>Create a Poll</CardTitle>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
          
          {/* Left Column: Editor Config */}
          <div className="md:col-span-3 space-y-6">
            
            {/* Question input */}
            <div className="space-y-2">
              <Label htmlFor="poll-question" className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Poll Question
              </Label>
              <Input
                id="poll-question"
                placeholder="What would you like to ask?"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="bg-slate-900/60 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-sm py-5 text-white"
              />
            </div>

            {/* Options list */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Options</Label>
                <span className="text-[11px] text-slate-500 font-medium">{options.length} / 4 options</span>
              </div>
              
              <div className="space-y-2.5">
                {options.map((option, index) => (
                  <div key={`option-${index}`} className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 w-5 text-center">{index + 1}.</span>
                    <div className="flex-1">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(event) => updateOption(index, event.target.value)}
                        className="bg-slate-900/40 border-slate-800/80 focus:border-indigo-500 focus:ring-indigo-500 text-sm text-white"
                      />
                    </div>

                    {/* Compact seed vote control */}
                    <div className="flex items-center gap-1 bg-slate-900/50 px-1 py-0.5 rounded-lg border border-slate-800/80 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => changeVotes(index, -1)}
                        className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
                      >
                        -
                      </Button>
                      <span className="text-xs font-mono font-medium text-slate-300 min-w-[2rem] text-center">
                        {results[index]?.votes || 0}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => changeVotes(index, 1)}
                        className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md"
                      >
                        +
                      </Button>
                    </div>

                    {options.length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeOption(index)}
                        className="h-9 w-9 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={addOption}
                size="sm"
                disabled={options.length >= 4}
                className="w-full mt-1 border-dashed border-slate-800 hover:border-indigo-500/60 hover:bg-indigo-500/5 hover:text-indigo-400 text-slate-400 text-xs py-4"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Option
              </Button>
            </div>

            {/* Unified Broadcast Settings */}
            <div className="space-y-4 pt-5 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Megaphone className="h-4 w-4 text-indigo-400" />
                  <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Broadcast settings</Label>
                </div>
                
                <button
                  type="button"
                  onClick={handlePublishToggle}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold transition-all border ${
                    published
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                      : "bg-slate-900/80 text-slate-500 border-slate-850 hover:border-slate-700 hover:text-slate-400"
                  }`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${published ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                  {published ? "Published & Active" : "Set to Published to Submit"}
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-450">Audience</Label>
                  <Input
                    value={audience}
                    onChange={(event) => setAudience(event.target.value)}
                    placeholder="e.g. Community"
                    className="bg-slate-900/40 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-sm text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-450">Expires in (hours)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={expiresInHours}
                    onChange={(event) =>
                      setExpiresInHours(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="bg-slate-900/40 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-sm text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-450">Broadcast Message</Label>
                <Input
                  value={broadcastMessage}
                  onChange={(event) => setBroadcastMessage(event.target.value)}
                  placeholder="Why should people answer this poll?"
                  className="bg-slate-900/40 border-slate-800 focus:border-indigo-500 focus:ring-indigo-500 text-sm text-white"
                />
              </div>
            </div>

          </div>

          {/* Right Column: Live Preview */}
          <div className="md:col-span-2 space-y-4 md:sticky md:top-0">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-400">Live Preview</Label>
              <Badge variant="outline" className="bg-slate-900/40 border-slate-800 text-[10px] px-2 py-0.5 text-slate-400">
                {totalVotes} total {totalVotes === 1 ? "vote" : "votes"}
              </Badge>
            </div>

            {/* Premium Interactive Poll Card */}
            <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/5 p-5 shadow-lg relative overflow-hidden backdrop-blur-sm">
              {/* Subtle top glowing line */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-1.5">
                  <span className={`inline-block h-2 w-2 rounded-full ${published ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-450">
                    {published ? "Live Poll" : "Draft Preview"}
                  </span>
                </div>
                {expiresInHours && (
                  <span className="text-[10px] text-slate-400 font-medium bg-slate-950/60 px-2 py-0.5 rounded-full border border-slate-900">
                    Expires in {expiresInHours}h
                  </span>
                )}
              </div>

              <h4 className="text-sm font-semibold text-white mb-3 line-clamp-3 leading-snug break-words">
                {question.trim() || "Untitled Poll Question"}
              </h4>

              {broadcastMessage.trim() && (
                <p className="text-[11px] text-slate-300 italic mb-4 bg-slate-950/40 p-2.5 rounded-lg border border-slate-900/50 leading-normal">
                  "{broadcastMessage.trim()}"
                </p>
              )}

              <div className="space-y-2.5">
                {options.map((option, index) => {
                  const votes = results[index]?.votes || 0;
                  const pct = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                  const formattedOption = option.trim() || `Option ${index + 1}`;
                  const isHighest = totalVotes > 0 && votes === maxVotes;

                  return (
                    <div key={`preview-${index}`} className="relative">
                      {/* Option container with background representing the progress */}
                      <div className={`relative overflow-hidden rounded-lg border p-3 flex items-center justify-between gap-3 text-xs transition-all duration-300 ${
                        isHighest 
                          ? "border-indigo-500/40 bg-slate-950/80 shadow-[0_0_10px_rgba(99,102,241,0.05)]" 
                          : "border-slate-850 bg-slate-950/40"
                      }`}>
                        {/* Progress Bar Background fill */}
                        <div
                          className={`absolute inset-y-0 left-0 transition-all duration-500 ease-out z-0 ${
                            isHighest ? "bg-indigo-500/15" : "bg-slate-800/15"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                        
                        {/* Text Content */}
                        <span className="relative font-medium text-slate-200 z-10 break-all pr-2">
                          {formattedOption}
                        </span>
                        
                        {/* Vote count / percent info */}
                        <div className="relative flex items-center gap-2 z-10 flex-shrink-0 font-semibold text-slate-355">
                          <span className="text-[10px] text-slate-400 bg-slate-950/80 px-1.5 py-0.5 rounded font-mono border border-slate-900">
                            {votes} {votes === 1 ? "v" : "v"}
                          </span>
                          <span className={`min-w-[2.2rem] text-right font-mono ${isHighest ? "text-indigo-400" : "text-slate-400"}`}>
                            {Math.round(pct)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer info inside preview */}
              <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-450">
                <span>Audience: <strong className="text-slate-300">{audience || "Everyone"}</strong></span>
                <span>Type: Multiple Choice</span>
              </div>
            </div>

            {/* Action button in the preview column so it is nicely placed */}
            <Button
              onClick={handleSubmit}
              disabled={!question.trim() || options.some((option) => !option.trim()) || !published || isSubmitting}
              className={`w-full mt-4 py-5 relative overflow-hidden transition-all duration-300 font-semibold ${
                published && question.trim() && !options.some((o) => !o.trim())
                  ? "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:opacity-95 text-white shadow-lg shadow-indigo-500/10 cursor-pointer"
                  : "bg-slate-800/80 text-slate-500 border border-slate-700/30 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Submit Poll
                </>
              )}
            </Button>
            
            {/* Helper warning if not published */}
            {!published && question.trim() && !options.some((o) => !o.trim()) && (
              <p className="text-[10px] text-slate-500 text-center animate-pulse">
                * Please toggle the Draft/Published switch to "Published" to submit this poll.
              </p>
            )}
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
