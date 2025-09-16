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
import { Spinner } from "@/components/ui/spinner";


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

  // Debounce the search query
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get current user info to exclude from results
  const currentUser = useQuery(api.users.getCurrentUser);

  // Fetch users based on search query
  const searchResults = useQuery(
    api.users.searchUsers,
    debouncedQuery.length > 0 ? { query: debouncedQuery, limit: 10 } : "skip"
  );

  // Handle query errors
  const hasError = searchResults === null; // Convex returns null on error

  // Filter out current user from results
  const filteredResults = searchResults?.filter(
    (user) => user.username !== currentUser?.username
  ) || [];

  const selectedUser = filteredResults?.find((user) => user.username === value);

  const handleSelect = useCallback((username: string) => {
    onChange(username);
    setOpen(false);
    setSearchQuery(username);
  }, [onChange]);

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
          className={cn("justify-between", className)}
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={selectedUser.avatar} />
                <AvatarFallback className="text-xs">
                  {selectedUser.displayName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate">
                {selectedUser.displayName} (@{selectedUser.username})
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full max-w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Type to search users..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>
              {debouncedQuery.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Start typing to search users...
                </p>
              ) : hasError ? (
                <div className="py-6 text-center text-sm">
                  <p className="text-destructive mb-1">Failed to search users</p>
                  <p className="text-muted-foreground text-xs">
                    Please try again or check your connection
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center text-sm">
                  <p className="text-muted-foreground mb-1">
                    No users found for "{debouncedQuery}"
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Try a different username or check spelling
                  </p>
                </div>
              )}
            </CommandEmpty>
            {hasError ? null : searchResults === undefined ? (
              <div className="py-6 text-center text-sm">
                <div className="flex justify-center mb-2">
                  <Spinner size={16} />
                </div>
                <p className="text-muted-foreground">Searching users...</p>
              </div>
            ) : filteredResults && filteredResults.length > 0 ? (
              <CommandGroup>
                {filteredResults.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={user.username}
                    onSelect={handleSelect}
                    className="flex items-center gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>
                        {user.displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {user.displayName}
                      </div>
                      <div className="text-sm text-muted-foreground truncate">
                        @{user.username}
                      </div>
                    </div>
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        value === user.username ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};