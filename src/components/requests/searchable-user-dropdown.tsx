"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface SearchableUserDropdownProps {
  value?: string;
  onChange: (username: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const SearchableUserDropdown: React.FC<SearchableUserDropdownProps> = ({
  value,
  onChange,
  placeholder = "Search users...",
  disabled = false,
  className,
}) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Optimize debouncing: update instantly on empty queries, otherwise use 200ms
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setDebouncedQuery("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get current user info to exclude from results
  const currentUser = useQuery(api.users.getCurrentUser);

  // Fetch users based on search query (reactive, real-time Convex subscription)
  const searchResults = useQuery(
    api.users.searchUsers,
    { query: debouncedQuery, limit: 20 }
  );

  const hasError = searchResults === null;

  // Filter out current user from search results
  const filteredResults = searchResults?.filter(
    (user) => user.username !== currentUser?.username
  ) || [];

  // Resolve the currently selected user profile to show in the trigger button (case-insensitive)
  const selectedUser = filteredResults?.find((user) => user.username.toLowerCase() === value?.toLowerCase()) || 
    (searchResults?.find((user) => user.username.toLowerCase() === value?.toLowerCase()));

  const handleSelect = useCallback((selectedValue: string) => {
    // Find matching user (case-insensitive) to retrieve the exact stored case username
    const match = searchResults?.find(
      (u) => u.username.toLowerCase() === selectedValue.toLowerCase()
    );
    const exactUsername = match ? match.username : selectedValue;
    onChange(exactUsername);
    setOpen(false);
    setSearchQuery("");
  }, [onChange, searchResults]);

  const handleOpenChange = useCallback((newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery("");
    }
  }, []);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between bg-[#0b0f19] border-[#1e293b] hover:border-[#38bdf8] text-white hover:bg-[#0f172a] shadow-inner transition-all duration-300 h-11 px-4 rounded-lg",
            className
          )}
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2.5 truncate">
              <div className="relative shrink-0">
                <Avatar className="w-6 h-6 border border-[#1e293b]">
                  <AvatarImage src={selectedUser.avatar} />
                  <AvatarFallback className="bg-[#1e293b] text-white text-[10px]">
                    {selectedUser.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span
                  className={cn(
                    "absolute bottom-0 right-0 w-2 h-2 rounded-full border border-[#0b0f19] shadow-sm",
                    selectedUser.isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
                  )}
                />
              </div>
              <span className="truncate text-sm font-medium text-slate-100">
                {selectedUser.displayName}
                <span className="text-slate-400 text-xs font-normal ml-1.5">
                  (@{selectedUser.username})
                </span>
              </span>
            </div>
          ) : (
            <span className="text-slate-400 text-sm font-normal">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-slate-400 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[var(--radix-popover-trigger-width)] max-w-[420px] p-0 bg-[#0e131f] border border-[#1e293b] shadow-[0_10px_40px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden backdrop-blur-xl z-50"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command shouldFilter={false} className="bg-transparent text-white border-0">
          <CommandInput
            placeholder="Type to filter users..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            className="h-11 border-0 border-b border-[#1e293b] bg-transparent text-slate-100 placeholder-slate-400 focus:ring-0 text-sm"
          />
          <CommandList className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1e293b]">
            {/* Error State */}
            {hasError && (
              <div className="py-6 text-center text-sm text-red-400 px-4">
                <p className="font-medium mb-1">Failed to fetch users</p>
                <p className="text-slate-400 text-xs">
                  Please try again or check your connection
                </p>
              </div>
            )}

            {/* Empty State */}
            {!hasError && searchResults !== undefined && filteredResults.length === 0 && (
              <div className="py-6 text-center text-sm text-slate-400 px-4">
                {debouncedQuery.length > 0 ? (
                  <div>
                    <p className="text-slate-300 mb-1">No users found matching "{debouncedQuery}"</p>
                    <p className="text-slate-400 text-xs">
                      Try another username or check for spelling errors
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-400 text-xs">No active users available</p>
                )}
              </div>
            )}

            {/* Shimmer / Skeleton Loading State */}
            {searchResults === undefined && !hasError && (
              <div className="space-y-1.5 p-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg animate-pulse bg-[#161e31]/20">
                    <div className="w-8 h-8 rounded-full bg-[#1e293b]/60 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-[#1e293b]/60 rounded w-1/3" />
                      <div className="h-2.5 bg-[#1e293b]/60 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Real-time suggested and searched user items */}
            {!hasError && searchResults !== undefined && filteredResults.length > 0 && (
              <CommandGroup heading={debouncedQuery ? "Search Results" : "Suggested Teammates"} className="text-slate-400 text-xs font-semibold px-2 pt-2">
                {filteredResults.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.username}
                    onSelect={handleSelect}
                    className={cn(
                      "mb-1 flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all duration-200 border border-transparent hover:border-[#38bdf8]/30 hover:bg-[#161e31]/80 text-slate-200 hover:text-white"
                    )}
                  >
                    {/* Avatar with dynamic online indicator */}
                    <div className="relative shrink-0">
                      <Avatar className="w-8 h-8 border border-[#1e293b] transition-transform duration-200 group-hover:scale-105">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback className="bg-[#1e293b] text-slate-200 font-semibold text-xs">
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span
                        className={cn(
                          "absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#0e131f] shadow-sm",
                          user.isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-500"
                        )}
                      />
                    </div>

                    {/* Display name and username */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-slate-200 truncate flex items-center gap-1.5">
                        {user.displayName}
                        
                        {/* Premium Discord/Slack style role indicators */}
                        {user.role && user.role !== "user" && (
                          <span className={cn(
                            "text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider uppercase shrink-0 scale-90 origin-left",
                            user.role === "admin" 
                              ? "bg-red-950/60 text-red-400 border border-red-900/30" 
                              : "bg-purple-950/60 text-purple-400 border border-purple-900/30"
                          )}>
                            {user.role}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400 truncate">
                        @{user.username}
                      </div>
                    </div>

                    {/* Check icon if currently selected */}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4 text-[#38bdf8]",
                        value?.toLowerCase() === user.username.toLowerCase() ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};