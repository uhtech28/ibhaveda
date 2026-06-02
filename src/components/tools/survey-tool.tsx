"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, Plus, Send, Trash2, Users } from "lucide-react";

interface SurveyQuestion {
  id: string;
  text: string;
  type: "text" | "multiple_choice";
  options?: string[];
}

interface SurveyResponse {
  id: string;
  respondent: string;
  submittedAt: number;
  answers: Record<string, string>;
}

interface SurveyContent {
  questions: SurveyQuestion[];
  responses?: SurveyResponse[];
  distribution?: {
    channels: string[];
    shareNote: string;
  };
}

interface SurveyToolProps {
  prompt: string;
  onSubmit: (content: SurveyContent) => void;
  initialContent?: SurveyContent;
  isSubmitting?: boolean;
}

const CHANNELS = ["Email", "Community", "Direct outreach", "Interview follow-up"];

export function SurveyTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
}: SurveyToolProps) {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(
    initialContent?.questions || [{ id: "1", text: "", type: "text" }],
  );
  const [responses, setResponses] = useState<SurveyResponse[]>(
    initialContent?.responses || [],
  );
  const [respondent, setRespondent] = useState("");
  const [draftAnswers, setDraftAnswers] = useState<Record<string, string>>({});
  const [shareNote, setShareNote] = useState(
    initialContent?.distribution?.shareNote || "",
  );
  const [channels, setChannels] = useState<string[]>(
    initialContent?.distribution?.channels || ["Community"],
  );

  useEffect(() => {
    if (!initialContent) return;
    setQuestions(initialContent.questions || [{ id: "1", text: "", type: "text" }]);
    setResponses(initialContent.responses || []);
    setShareNote(initialContent.distribution?.shareNote || "");
    setChannels(initialContent.distribution?.channels || ["Community"]);
  }, [initialContent]);

  const addQuestion = () => {
    setQuestions((current) => [
      ...current,
      { id: Date.now().toString(), text: "", type: "text" },
    ]);
  };

  const updateQuestion = (id: string, updates: Partial<SurveyQuestion>) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id ? { ...question, ...updates } : question,
      ),
    );
  };

  const removeQuestion = (id: string) => {
    if (questions.length <= 1) return;
    setQuestions((current) => current.filter((question) => question.id !== id));
  };

  const addOption = (questionId: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? { ...question, options: [...(question.options || []), ""] }
          : question,
      ),
    );
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: (question.options || []).map((option, index) =>
                index === optionIndex ? value : option,
              ),
            }
          : question,
      ),
    );
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: (question.options || []).filter(
                (_option, index) => index !== optionIndex,
              ),
            }
          : question,
      ),
    );
  };

  const toggleChannel = (channel: string) => {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((entry) => entry !== channel)
        : [...current, channel],
    );
  };

  const addResponse = () => {
    const ready =
      respondent.trim() &&
      questions.every((question) => {
        const answer = draftAnswers[question.id]?.trim();
        return !!question.text.trim() && !!answer;
      });

    if (!ready) return;

    setResponses((current) => [
      ...current,
      {
        id: Date.now().toString(),
        respondent: respondent.trim(),
        submittedAt: Date.now(),
        answers: draftAnswers,
      },
    ]);
    setRespondent("");
    setDraftAnswers({});
  };

  const removeResponse = (responseId: string) => {
    setResponses((current) =>
      current.filter((response) => response.id !== responseId),
    );
  };

  const summary = useMemo(() => {
    return questions.map((question) => {
      if (question.type === "multiple_choice") {
        const counts = (question.options || []).map((option) => ({
          option,
          count: responses.filter(
            (response) => response.answers[question.id] === option,
          ).length,
        }));
        return { questionId: question.id, counts };
      }

      return {
        questionId: question.id,
        textResponses: responses
          .map((response) => response.answers[question.id])
          .filter(Boolean),
      };
    });
  }, [questions, responses]);

  const handleSubmit = () => {
    const allFilled = questions.every((question) => question.text.trim());
    const optionsValid = questions.every(
      (question) =>
        question.type !== "multiple_choice" ||
        ((question.options || []).length >= 2 &&
          (question.options || []).every((option) => option.trim())),
    );

    if (!allFilled || !optionsValid || responses.length === 0) return;

    onSubmit({
      questions,
      responses,
      distribution: {
        channels,
        shareNote,
      },
    });
  };

  return (
    <Card className="bg-transparent border-0 shadow-none p-0">
      <CardHeader className="hidden">
        <CardTitle>Build Your Survey</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <Tabs defaultValue="builder">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 rounded-xl p-1 mb-5">
            <TabsTrigger value="builder" className="data-[state=active]:bg-white/10 rounded-lg text-xs font-semibold text-zinc-300 data-[state=active]:text-white transition-all">Builder</TabsTrigger>
            <TabsTrigger value="responses" className="data-[state=active]:bg-white/10 rounded-lg text-xs font-semibold text-zinc-300 data-[state=active]:text-white transition-all">Responses</TabsTrigger>
            <TabsTrigger value="summary" className="data-[state=active]:bg-white/10 rounded-lg text-xs font-semibold text-zinc-300 data-[state=active]:text-white transition-all">Summary</TabsTrigger>
          </TabsList>

          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 sm:p-5">
          <TabsContent value="builder" className="space-y-4 mt-0">
              {/* 1. Distribution */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-400" />
                  <Label className="text-sm font-bold text-zinc-200">Distribution Channels</Label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CHANNELS.map((channel) => (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                        channels.includes(channel)
                          ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                          : "border-white/10 bg-white/[0.02] text-zinc-400 hover:bg-white/5 hover:text-zinc-300"
                      }`}
                    >
                      {channel}
                    </button>
                  ))}
                </div>
                <Textarea
                  className="min-h-[80px] bg-[#0D111A] border-white/10 text-xs placeholder:text-zinc-500 rounded-xl focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40"
                  placeholder="How did you distribute this survey, and what audience did it reach?"
                  value={shareNote}
                  onChange={(event) => setShareNote(event.target.value)}
                />
              </div>

              {/* Separator Line */}
              <div className="h-px bg-white/10" />

              {/* 2. Questions List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-indigo-400" />
                    <Label className="text-sm font-bold text-zinc-200">Survey Questions</Label>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addQuestion} 
                    className="h-7 px-2.5 rounded-lg border-white/10 bg-white/[0.02] text-[10px] font-bold text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add Question
                  </Button>
                </div>

                <div className="space-y-4">
                  {questions.map((question, questionIndex) => (
                    <div 
                      key={question.id} 
                      className="relative space-y-3 pb-4 border-b border-white/5 last:pb-0 last:border-b-0"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                          Question {questionIndex + 1}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeQuestion(question.id)}
                          disabled={questions.length <= 1}
                          className="h-6 w-6 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <Input
                        placeholder="Enter your question..."
                        value={question.text}
                        onChange={(event) =>
                          updateQuestion(question.id, { text: event.target.value })
                        }
                        className="bg-[#0D111A] border-white/10 text-xs placeholder:text-zinc-500 rounded-xl focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40"
                      />

                      <RadioGroup
                        value={question.type}
                        onValueChange={(value: "text" | "multiple_choice") =>
                          updateQuestion(question.id, {
                            type: value,
                            options: value === "multiple_choice" ? ["", ""] : undefined,
                          })
                        }
                        className="flex flex-wrap gap-4"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="text" id={`survey-text-${question.id}`} className="border-white/20 text-indigo-500" />
                          <Label htmlFor={`survey-text-${question.id}`} className="text-[11px] text-zinc-400 font-medium">
                            Text response
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem
                            value="multiple_choice"
                            id={`survey-mc-${question.id}`}
                            className="border-white/20 text-indigo-500"
                          />
                          <Label htmlFor={`survey-mc-${question.id}`} className="text-[11px] text-zinc-400 font-medium">
                            Multiple choice
                          </Label>
                        </div>
                      </RadioGroup>

                      {question.type === "multiple_choice" && (
                        <div className="space-y-2 pl-3 border-l-2 border-indigo-500/20 py-1">
                          {(question.options || []).map((option, optionIndex) => (
                            <div key={`${question.id}-${optionIndex}`} className="flex items-center gap-2">
                              <Input
                                placeholder={`Option ${optionIndex + 1}`}
                                value={option}
                                onChange={(event) =>
                                  updateOption(question.id, optionIndex, event.target.value)
                                }
                                className="bg-[#0D111A] border-white/10 text-xs placeholder:text-zinc-500 rounded-xl focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40"
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeOption(question.id, optionIndex)}
                                disabled={(question.options?.length || 0) <= 2}
                                className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          ))}
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => addOption(question.id)}
                            className="h-7 px-2.5 rounded-lg border-white/10 bg-white/[0.01] text-[10px] text-zinc-300 hover:bg-white/5 transition-colors"
                          >
                            <Plus className="mr-1 h-3 w-3" />
                            Add option
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
          </TabsContent>

          <TabsContent value="responses" className="space-y-4 mt-0">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-400" />
                <Label className="text-sm font-bold text-zinc-200">Capture Survey Response</Label>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">Respondent Identifier</Label>
                  <Input
                    placeholder="Respondent name, customer segment, or email..."
                    value={respondent}
                    onChange={(event) => setRespondent(event.target.value)}
                    className="bg-[#0D111A] border-white/10 text-xs placeholder:text-zinc-500 rounded-xl focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40"
                  />
                </div>

                <div className="space-y-4 pt-1">
                  {questions.map((question, qIdx) => (
                    <div key={`response-${question.id}`} className="space-y-2 pb-3 border-b border-white/5 last:pb-0 last:border-b-0">
                      <Label className="text-xs font-bold text-zinc-300">
                        {qIdx + 1}. {question.text || "Untitled question"}
                      </Label>
                      {question.type === "multiple_choice" ? (
                        <RadioGroup
                          value={draftAnswers[question.id] || ""}
                          onValueChange={(value) =>
                            setDraftAnswers((current) => ({
                              ...current,
                              [question.id]: value,
                            }))
                          }
                          className="flex flex-col gap-2 pt-1"
                        >
                          {(question.options || []).map((option) => (
                            <div key={option} className="flex items-center gap-2">
                              <RadioGroupItem
                                value={option}
                                id={`${question.id}-${option}`}
                                className="border-white/20 text-indigo-500"
                              />
                              <Label htmlFor={`${question.id}-${option}`} className="text-xs text-zinc-400 hover:text-zinc-200 cursor-pointer">
                                {option || "Untitled option"}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <Textarea
                          placeholder="Enter the respondent's exact answer..."
                          value={draftAnswers[question.id] || ""}
                          onChange={(event) =>
                            setDraftAnswers((current) => ({
                              ...current,
                              [question.id]: event.target.value,
                            }))
                          }
                          className="min-h-[70px] bg-[#0D111A] border-white/10 text-xs placeholder:text-zinc-500 rounded-xl focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/40"
                        />
                      )}
                    </div>
                  ))}
                </div>

                <Button 
                  variant="outline" 
                  onClick={addResponse} 
                  className="w-full h-9 rounded-xl border-white/10 bg-white/[0.02] text-xs font-bold text-indigo-300 hover:bg-indigo-500/10 transition-colors"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Captured Response
                </Button>
              </div>
            {responses.length > 0 && (
              <div className="space-y-3.5 border-t border-white/10 pt-4">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">
                  Captured Responses ({responses.length})
                </h4>
                <div className="space-y-2.5">
                  {responses.map((response) => (
                    <div key={response.id} className="rounded-2xl border border-white/5 bg-white/[0.01] p-4 transition-all hover:bg-white/[0.02] hover:border-white/10">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-zinc-100">{response.respondent}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">
                            {new Date(response.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResponse(response.id)}
                          className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-2.5 text-xs border-t border-white/5 pt-2.5">
                        {questions.map((question) => (
                          <div key={`${response.id}-${question.id}`} className="space-y-0.5">
                            <p className="font-semibold text-zinc-400 text-[11px]">{question.text}:</p>
                            <p className="text-zinc-200 italic pl-1.5 border-l border-white/10">
                              {response.answers[question.id] || "No answer"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4 mt-0">
            <div className="flex gap-2 px-1">
              <span className="inline-flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold rounded-lg px-2.5 py-1">
                {responses.length} responses
              </span>
              <span className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-zinc-300 text-xs font-bold rounded-lg px-2.5 py-1">
                {channels.length} channels used
              </span>
            </div>

            <div className="space-y-5">
              {questions.map((question, index) => {
                const entry = summary.find((item) => item.questionId === question.id);
                if (!entry) return null;

                if ("counts" in entry) {
                  const counts = entry.counts || [];
                  const maxCount = Math.max(
                    1,
                    ...counts.map((count) => count.count),
                  );

                  return (
                    <div key={question.id} className="space-y-3 pb-5 border-b border-white/5 last:pb-0 last:border-b-0">
                      <Label className="text-xs font-bold text-zinc-200">
                        {index + 1}. {question.text}
                      </Label>
                      <div className="space-y-2.5 pl-1.5">
                        {counts.map((count) => (
                          <div key={`${question.id}-${count.option}`} className="space-y-1">
                            <div className="flex items-center justify-between text-xs font-medium">
                              <span className="text-zinc-400">{count.option || "Untitled option"}</span>
                              <span className="text-zinc-300 font-bold">{count.count}</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-white/5">
                              <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 shadow-[0_0_8px_rgba(99,102,241,0.3)]"
                                style={{ width: `${(count.count / maxCount) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={question.id} className="space-y-3 pb-5 border-b border-white/5 last:pb-0 last:border-b-0">
                    <Label className="text-xs font-bold text-zinc-200">
                      {index + 1}. {question.text}
                    </Label>
                    <div className="space-y-2">
                      {entry.textResponses.length > 0 ? (
                        entry.textResponses.map((answer, index) => (
                          <p
                            key={`${question.id}-answer-${index}`}
                            className="rounded-xl bg-[#0D111A] border border-white/5 p-3 text-xs text-zinc-300 italic leading-relaxed"
                          >
                            "{answer}"
                          </p>
                        ))
                      ) : (
                        <p className="text-xs text-zinc-500 italic pl-1">No responses captured yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
          </div>
        </Tabs>

        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            responses.length === 0 ||
            !questions.every((question) => question.text.trim())
          }
          className="w-full h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-zinc-800 disabled:to-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-lg shadow-indigo-900/20 active:scale-[0.99] transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Survey Data...
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
  );
}
