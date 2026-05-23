"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Check, BookOpen, Users, Lock } from "lucide-react";

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
    <label className="flex items-center gap-2 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
        />
        <div
          className={`w-11 h-6 rounded-full transition-colors ${
            checked ? "bg-primary" : "bg-muted-foreground/30"
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
              checked ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </div>
      </div>
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}

export function JournalTool({
  prompt,
  onSubmit,
  initialContent,
  isSubmitting,
}: JournalToolProps) {
  const [entries, setEntries] = useState<JournalEntry[]>(
    initialContent?.entries || [],
  );

  useEffect(() => {
    if (initialContent?.entries) {
      setEntries(initialContent.entries);
    }
  }, [initialContent]);
  const [title, setTitle] = useState("");
  const [entry, setEntry] = useState("");
  const [sharedWithTeam, setSharedWithTeam] = useState(false);

  const wordCount = entry.trim() ? entry.trim().split(/\s+/).length : 0;

  const addEntry = () => {
    if (!entry.trim()) return;

    const newEntry: JournalEntry = {
      id: `entry-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: title.trim() || "Untitled Entry",
      entry: entry.trim(),
      wordCount,
      timestamp: Date.now(),
      sharedWithTeam,
    };

    setEntries([...entries, newEntry]);
    setTitle("");
    setEntry("");
    setSharedWithTeam(false);
  };

  const deleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const toggleEntryShare = (id: string) => {
    setEntries(
      entries.map((e) =>
        e.id === id ? { ...e, sharedWithTeam: !e.sharedWithTeam } : e,
      ),
    );
  };

  const handleSubmit = () => {
    if (entries.length === 0) return;
    onSubmit({
      entries,
      timestamp: Date.now(),
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          <CardTitle>Journal Entry</CardTitle>
        </div>
        <CardDescription>{prompt}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Entry Form */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label htmlFor="journal-title">Entry Title (optional)</Label>
            <Input
              id="journal-title"
              placeholder="Give your entry a title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="journal-entry">Your Journal Entry</Label>
            <Textarea
              id="journal-entry"
              placeholder="What's on your mind? Reflect on your progress, challenges, insights, or learnings..."
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              className="min-h-[200px] resize-y"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{wordCount} words</span>
              <span>
                💡 Tip: Use markdown formatting (# headers, **bold**, *italic*)
              </span>
            </div>
          </div>

          {/* Share Toggle */}
          <div className="flex items-center justify-between p-3 border rounded-md bg-background">
            <div className="flex items-center gap-2">
              {sharedWithTeam ? (
                <Users className="h-4 w-4 text-primary" />
              ) : (
                <Lock className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <div className="text-sm font-medium">Share with team</div>
                <div className="text-xs text-muted-foreground">
                  {sharedWithTeam
                    ? "This entry will be visible to your team"
                    : "This entry will remain private"}
                </div>
              </div>
            </div>
            <ToggleSwitch
              checked={sharedWithTeam}
              onCheckedChange={setSharedWithTeam}
              label=""
            />
          </div>

          <Button
            onClick={addEntry}
            disabled={!entry.trim()}
            className="w-full"
          >
            <Check className="mr-2 h-4 w-4" />
            Add Entry
          </Button>
        </div>

        {/* Existing Entries List */}
        {entries.length > 0 && (
          <div className="space-y-3">
            <Label className="text-base">Your Entries ({entries.length})</Label>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {entries.map((journalEntry) => (
                <div
                  key={journalEntry.id}
                  className={`p-4 border rounded-lg ${
                    journalEntry.sharedWithTeam
                      ? "border-primary bg-primary/5"
                      : "border-border bg-background"
                  }`}
                >
                  {/* Entry Header */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">
                        {journalEntry.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {new Date(journalEntry.timestamp).toLocaleString()} •{" "}
                        {journalEntry.wordCount} words
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteEntry(journalEntry.id)}
                      title="Delete entry"
                    >
                      ×
                    </Button>
                  </div>

                  {/* Entry Content */}
                  <div className="text-sm whitespace-pre-wrap mb-3 p-3 bg-muted/30 rounded">
                    {journalEntry.entry}
                  </div>

                  {/* Share Toggle for Existing Entry */}
                  <div className="flex items-center justify-between p-2 border-t">
                    <div className="flex items-center gap-2 text-sm">
                      {journalEntry.sharedWithTeam ? (
                        <>
                          <Users className="h-4 w-4 text-primary" />
                          <span className="font-medium text-primary">
                            Shared with team
                          </span>
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Private</span>
                        </>
                      )}
                    </div>
                    <ToggleSwitch
                      checked={journalEntry.sharedWithTeam}
                      onCheckedChange={() => toggleEntryShare(journalEntry.id)}
                      label=""
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between text-sm border-t pt-3">
          <div className="flex gap-4">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>
                {entries.filter((e) => !e.sharedWithTeam).length} Private
              </span>
            </div>
            <div className="flex items-center gap-1 text-primary">
              <Users className="h-3 w-3" />
              <span>
                {entries.filter((e) => e.sharedWithTeam).length} Shared
              </span>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={entries.length === 0 || isSubmitting}
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
              Submit Journal ({entries.length}{" "}
              {entries.length === 1 ? "entry" : "entries"})
            </>
          )}
        </Button>

        {entries.length === 0 && (
          <p className="text-xs text-center text-muted-foreground">
            Add at least one journal entry to submit
          </p>
        )}
      </CardContent>
    </Card>
  );
}
