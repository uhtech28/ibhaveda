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
    <Card className="border border-white/10 bg-[#0D111A]/95 shadow-2xl rounded-2xl overflow-hidden p-5 md:p-6 space-y-6">
      <div className="space-y-1.5 pb-2 border-b border-white/5">
        <CardTitle className="text-md font-bold text-white flex items-center gap-2">
          📊 Build Your Survey
        </CardTitle>
        <CardDescription className="text-xs text-zinc-400">{prompt}</CardDescription>
      </div>

      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white/5 border border-white/10 p-1 rounded-xl">
          <TabsTrigger value="builder" className="rounded-lg text-xs font-bold text-zinc-400 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Builder</TabsTrigger>
          <TabsTrigger value="responses" className="rounded-lg text-xs font-bold text-zinc-400 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Responses</TabsTrigger>
          <TabsTrigger value="summary" className="rounded-lg text-xs font-bold text-zinc-400 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Summary</TabsTrigger>
        </TabsList>

        {/* Builder Tab Content */}
        <TabsContent value="builder" className="space-y-6 mt-5 focus:outline-none">
          {/* Distribution Section */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2 text-zinc-200">
              <Send className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Distribution Channels</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {CHANNELS.map((channel) => {
                const active = channels.includes(channel);
                return (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all duration-200 ${
                      active
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300 shadow-md shadow-indigo-500/5"
                        : "border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {channel}
                  </button>
                );
              })}
            </div>
            <Textarea
              className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm min-h-[90px] resize-none"
              placeholder="How did you distribute this survey, and what audience did it reach?"
              value={shareNote}
              onChange={(event) => setShareNote(event.target.value)}
            />
          </div>

          <div className="border-t border-white/10 my-4" />

          {/* Questions Section */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Survey Questions</span>
              <span className="text-[10px] text-zinc-500 font-semibold">{questions.length} Question{questions.length !== 1 ? "s" : ""}</span>
            </div>

            <div className="space-y-6 divide-y divide-white/5">
              {questions.map((question, questionIndex) => (
                <div key={question.id} className={`space-y-3.5 ${questionIndex > 0 ? "pt-5" : ""}`}>
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      Question {questionIndex + 1}
                    </Label>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeQuestion(question.id)}
                      disabled={questions.length <= 1}
                      className="h-7 w-7 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                    className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                  />

                  <RadioGroup
                    value={question.type}
                    onValueChange={(value: "text" | "multiple_choice") =>
                      updateQuestion(question.id, {
                        type: value,
                        options: value === "multiple_choice" ? ["", ""] : undefined,
                      })
                    }
                    className="flex flex-wrap gap-5 mt-1"
                  >
                    <div className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem value="text" id={`survey-text-${question.id}`} className="border-white/20 text-indigo-600 focus:ring-indigo-500/50" />
                      <Label htmlFor={`survey-text-${question.id}`} className="text-xs text-zinc-300 font-medium cursor-pointer">
                        Text response
                      </Label>
                    </div>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <RadioGroupItem
                        value="multiple_choice"
                        id={`survey-mc-${question.id}`}
                        className="border-white/20 text-indigo-600 focus:ring-indigo-500/50"
                      />
                      <Label htmlFor={`survey-mc-${question.id}`} className="text-xs text-zinc-300 font-medium cursor-pointer">
                        Multiple choice
                      </Label>
                    </div>
                  </RadioGroup>

                  {question.type === "multiple_choice" && (
                    <div className="space-y-2.5 pl-3 border-l-2 border-indigo-500/20 mt-2">
                      {(question.options || []).map((option, optionIndex) => (
                        <div key={`${question.id}-${optionIndex}`} className="flex items-center gap-2">
                          <Input
                            placeholder={`Option ${optionIndex + 1}`}
                            value={option}
                            onChange={(event) =>
                              updateOption(question.id, optionIndex, event.target.value)
                            }
                            className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeOption(question.id, optionIndex)}
                            disabled={(question.options?.length || 0) <= 2}
                            className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(question.id)}
                        className="bg-transparent border-white/10 hover:bg-white/5 text-xs text-zinc-300 rounded-lg py-1 px-2.5 h-8 flex items-center gap-1.5"
                      >
                        <Plus className="h-3.5 w-3.5 text-indigo-400" />
                        <span>Add Option</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                onClick={addQuestion}
                className="w-full bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-xs font-bold py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4 text-indigo-400" />
                <span>Add Question</span>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Responses Tab Content */}
        <TabsContent value="responses" className="space-y-6 mt-5 focus:outline-none">
          {/* Capture Response Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-zinc-200">
              <Users className="h-4 w-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Capture Response</span>
            </div>
            <Input
              placeholder="Respondent name or segment"
              value={respondent}
              onChange={(event) => setRespondent(event.target.value)}
              className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm"
            />

            <div className="space-y-4 pl-3 border-l-2 border-indigo-500/20">
              {questions.map((question) => (
                <div key={`response-${question.id}`} className="space-y-2">
                  <Label className="text-xs font-semibold text-zinc-300">{question.text || "Untitled question"}</Label>
                  {question.type === "multiple_choice" ? (
                    <RadioGroup
                      value={draftAnswers[question.id] || ""}
                      onValueChange={(value) =>
                        setDraftAnswers((current) => ({
                          ...current,
                          [question.id]: value,
                        }))
                      }
                      className="flex flex-col gap-2 mt-1"
                    >
                      {(question.options || []).map((option) => (
                        <div key={option} className="flex items-center gap-2 cursor-pointer">
                          <RadioGroupItem
                            value={option}
                            id={`${question.id}-${option}`}
                            className="border-white/20 text-indigo-600 focus:ring-indigo-500/50"
                          />
                          <Label htmlFor={`${question.id}-${option}`} className="text-xs text-zinc-400 cursor-pointer">{option || "Untitled option"}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    <Textarea
                      placeholder="Enter the respondent's answer"
                      value={draftAnswers[question.id] || ""}
                      onChange={(event) =>
                        setDraftAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                      className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 text-sm min-h-[60px] resize-none"
                    />
                  )}
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addResponse}
              className="w-full bg-transparent border-white/10 hover:bg-white/5 hover:text-white text-xs font-bold py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4 text-indigo-400" />
              <span>Add Response</span>
            </Button>
          </div>

          {responses.length > 0 && (
            <>
              <div className="border-t border-white/10 my-4" />

              {/* Submitted Responses List */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">Submitted Responses</span>

                <div className="space-y-4 divide-y divide-white/5">
                  {responses.map((response, responseIndex) => (
                    <div key={response.id} className={`space-y-2.5 ${responseIndex > 0 ? "pt-4" : ""}`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{response.respondent}</p>
                          <p className="text-[10px] text-zinc-500 font-medium">
                            {new Date(response.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeResponse(response.id)}
                          className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="space-y-2 pl-3 border-l border-white/10 text-xs">
                        {questions.map((question) => (
                          <div key={`${response.id}-${question.id}`} className="leading-relaxed">
                            <span className="font-bold text-zinc-400">{question.text}: </span>
                            <span className="text-zinc-300">
                              {response.answers[question.id] || "No answer"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </TabsContent>

        {/* Summary Tab Content */}
        <TabsContent value="summary" className="space-y-6 mt-5 focus:outline-none">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-300 border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">{responses.length} responses</Badge>
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-300 border-emerald-500/30 text-[10px] font-bold uppercase tracking-wider">{channels.length} channels used</Badge>
          </div>

          <div className="space-y-6 divide-y divide-white/5">
            {questions.map((question, questionIndex) => {
              const entry = summary.find((item) => item.questionId === question.id);
              if (!entry) return null;

              const isFirst = questionIndex === 0;

              if ("counts" in entry) {
                const counts = entry.counts || [];
                const maxCount = Math.max(
                  1,
                  ...counts.map((count) => count.count),
                );

                return (
                  <div key={question.id} className={`space-y-3 ${!isFirst ? "pt-5" : ""}`}>
                    <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{question.text || "Untitled Question"}</Label>
                    <div className="space-y-3">
                      {counts.map((count) => (
                        <div key={`${question.id}-${count.option}`} className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span className="text-zinc-400">{count.option || "Untitled option"}</span>
                            <span className="text-zinc-300 font-bold">{count.count}</span>
                          </div>
                          <div className="h-2 rounded-full bg-white/5">
                            <div
                              className="h-2 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50"
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
                <div key={question.id} className={`space-y-3 ${!isFirst ? "pt-5" : ""}`}>
                  <Label className="text-xs font-bold text-zinc-300 uppercase tracking-wider">{question.text || "Untitled Question"}</Label>
                  <div className="space-y-2">
                    {entry.textResponses.length > 0 ? (
                      entry.textResponses.map((answer, index) => (
                        <p
                          key={`${question.id}-answer-${index}`}
                          className="rounded-lg bg-[#121824] border border-white/5 p-3 text-xs leading-relaxed text-zinc-300"
                        >
                          {answer}
                        </p>
                      ))
                    ) : (
                      <p className="text-xs text-zinc-500 italic">No text responses yet.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-3 border-t border-white/5">
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            responses.length === 0 ||
            !questions.every((question) => question.text.trim())
          }
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl shadow-lg hover:shadow-indigo-500/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Submit Survey</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
