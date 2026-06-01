"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Check, Users, Lock } from "lucide-react";

interface JournalEntry {
  id: string;
  title: string;
  entry: string;
  wordCount: number;
  timestamp: number;
  sharedWithTeam: boolean;
}

interface JournalToolProps {
  prompt: string;
  onSubmit: (content: { entries: JournalEntry[]; timestamp: number }) => void;
  initialContent?: { entries: JournalEntry[]; timestamp: number };
  isSubmitting?: boolean;
}

// Custom Toggle Switch Component
function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? "bg-violet-500" : "bg-white/10"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
      {label && <span className="text-sm font-medium text-white">{label}</span>}
    </label>
  );
}

export function JournalTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
}: JournalToolProps) {
  const [title, setTitle] = useState(initialContent?.entries?.[0]?.title || "");
  const [entry, setEntry] = useState(initialContent?.entries?.[0]?.entry || "");
  const [sharedWithTeam, setSharedWithTeam] = useState(
    initialContent?.entries?.[0]?.sharedWithTeam || false
  );

  useEffect(() => {
    if (initialContent?.entries?.[0]) {
      setTitle(initialContent.entries[0].title);
      setEntry(initialContent.entries[0].entry);
      setSharedWithTeam(initialContent.entries[0].sharedWithTeam);
    }
  }, [initialContent]);

  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;

  const handleSubmit = () => {
    if (!entry.trim()) return;

    const singleEntry: JournalEntry = {
      id: initialContent?.entries?.[0]?.id || `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim() || "Untitled Entry",
      entry: entry.trim(),
      wordCount,
      timestamp: Date.now(),
      sharedWithTeam,
    };

    onSubmit({
      entries: [singleEntry],
      timestamp: Date.now(),
    });
  };

  return (
    <div className="space-y-5 py-2">
      {prompt && (
        <p className="text-xs text-zinc-400 font-medium leading-relaxed">
          {prompt}
        </p>
      )}

      <div className="space-y-4">
        {/* Title Input */}
        <div className="space-y-1.5">
          <Label htmlFor="journal-title" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Entry Title (optional)
          </Label>
          <Input
            id="journal-title"
            placeholder="Give your entry a title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#121824] border-white/10 text-white rounded-lg focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 placeholder:text-zinc-600"
          />
        </div>

        {/* Textarea Input */}
        <div className="space-y-1.5">
          <Label htmlFor="journal-entry" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Your Journal Entry
          </Label>
          <Textarea
            id="journal-entry"
            placeholder="What's on your mind? Reflect on your progress, challenges, insights, or learnings..."
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
            className="min-h-[220px] bg-[#121824] border-white/10 text-white rounded-lg focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 placeholder:text-zinc-600 resize-none text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-medium">
            <span>{wordCount} words</span>
            <span>
              💡 Tip: Use markdown formatting (# headers, **bold**, *italic*)
            </span>
          </div>
        </div>

        {/* Share Switch */}
        <div className="flex items-center justify-between p-3.5 border border-white/10 rounded-xl bg-[#121824]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              {sharedWithTeam ? (
                <Users className="h-4 w-4 text-violet-400" />
              ) : (
                <Lock className="h-4 w-4 text-zinc-500" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold text-white">Share with team</div>
              <div className="text-[10px] text-zinc-500 font-medium">
                {sharedWithTeam
                  ? "This entry will be visible to your team members"
                  : "This entry will remain private to you"}
              </div>
            </div>
          </div>
          <ToggleSwitch
            checked={sharedWithTeam}
            onCheckedChange={setSharedWithTeam}
            label=""
          />
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-3 border-t border-white/5">
        <Button
          onClick={handleSubmit}
          disabled={!entry.trim() || isSubmitting}
          className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-xl shadow-lg hover:shadow-violet-500/20 transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving Entry...</span>
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              <span>Submit Journal Entry</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
