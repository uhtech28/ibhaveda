"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "convex/react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Loader2, Search, MessageSquarePlus, X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface NewDirectMessagePanelProps {
  onBack: () => void;
  onClose: () => void;
  onSelectUser: (userId: Id<"users">) => void;
}

/**
 * Inline "New Message" panel that replaces the GroupList view inside the
 * chat sheet when the user taps the + button on the Direct tab. Renders
 * inside the same chat widget layer so it inherits the panel's z-index
 * (no portal / z-index conflicts).
 *
 * Powered by `api.users.searchUsers` — same query used by global search,
 * so results are consistent across the app.
 */
export const NewDirectMessagePanel: React.FC<NewDirectMessagePanelProps> = ({
  onBack,
  onClose,
  onSelectUser,
}) => {
  const [rawQuery, setRawQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handle = window.setTimeout(() => setDebouncedQuery(rawQuery.trim()), 200);
    return () => window.clearTimeout(handle);
  }, [rawQuery]);

  // Focus the input deterministically on mount. `autoFocus` alone can
  // race with the parent sheet's focus-trap on first paint and lose
  // focus, which leaves users unable to type.
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(id);
  }, []);

  // Always run the search — when the query is empty, `searchUsers`
  // returns a suggestion list (online first, then recently active).
  // Showing suggestions immediately means the user can pick someone
  // even before typing.
  const results = useQuery(api.users.searchUsers, {
    query: debouncedQuery,
    limit: 20,
  });

  const hasQuery = debouncedQuery.length > 0;
  const isLoading = results === undefined;
  const safeResults = useMemo(() => results ?? [], [results]);

  return (
    <div className="w-full h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-3 py-2 border-b flex items-center justify-between shrink-0 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-1 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm truncate">
            <MessageSquarePlus className="w-3.5 h-3.5 text-primary" />
            New Message
          </h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8" aria-label="Close">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Search input */}
      <div className="px-3 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            placeholder="Search by username..."
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">
          Find someone by their @username and tap to start a chat.
        </p>
      </div>

      {/* Results */}
      <div className="flex-1 min-h-0 border-t border-border/40">
        <ScrollArea className="h-full w-full">
          <div className="p-2">
            {isLoading && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" />
                {hasQuery ? "Searching..." : "Loading suggestions..."}
              </div>
            )}

            {!isLoading && safeResults.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                {hasQuery
                  ? `No users found for "${debouncedQuery}".`
                  : "No people to suggest yet."}
              </div>
            )}

            {!isLoading && safeResults.length > 0 && (
              <>
                {!hasQuery && (
                  <p className="px-3 pb-2 pt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Suggested
                  </p>
                )}
                <ul className="space-y-1">
                {safeResults.map((u) => (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => onSelectUser(u.id as Id<"users">)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent/60 transition-colors text-left"
                    >
                      <Avatar className="w-10 h-10 border shrink-0">
                        <AvatarImage src={u.avatar} alt={u.displayName} />
                        <AvatarFallback>
                          {u.displayName?.charAt(0)?.toUpperCase() ||
                            u.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground truncate">
                          {u.displayName || u.username}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          @{u.username}
                        </div>
                      </div>
                      <MessageSquarePlus className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  </li>
                ))}
                </ul>
              </>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

// Keep the old default export name to avoid import breakage elsewhere.
export default NewDirectMessagePanel;
// And re-export under the dialog name too in case anything else imports it.
export { NewDirectMessagePanel as NewDirectMessageDialog };
