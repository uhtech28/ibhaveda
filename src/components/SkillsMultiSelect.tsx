"use client";

import React, { useState, useMemo } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { skillCardGroups } from "@/lib/options";

export interface SkillOption {
  value: string;
  label: string;
}

interface SkillsMultiSelectProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSelection?: number;
  mandatorySkills?: string[];
  hideBadges?: boolean;
}

export function SkillsMultiSelect({
  selectedSkills,
  onChange,
  placeholder = "Select skills...",
  maxSelection,
  mandatorySkills = [],
  hideBadges = false,
}: SkillsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredGroups = useMemo(() => {
    if (!searchValue) return skillCardGroups;
    const q = searchValue.toLowerCase();
    return skillCardGroups
      .map(g => ({ ...g, items: g.items.filter(item => item.label.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [searchValue]);

  const handleSelect = (value: string) => {
    const newSelected = selectedSkills.includes(value)
      ? mandatorySkills.includes(value)
        ? selectedSkills
        : selectedSkills.filter(s => s !== value)
      : maxSelection && selectedSkills.length >= maxSelection
        ? selectedSkills
        : [...selectedSkills, value];
    onChange(newSelected);
  };

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between min-w-0"
          >
            <span className="truncate text-left flex-1 min-w-0">
              {selectedSkills.length > 0 ? `${selectedSkills.length} selected` : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0 flex flex-col h-[min(50dvh,420px)] overflow-hidden"
          align="start"
          side="bottom"
          sideOffset={4}
          collisionPadding={16}
          avoidCollisions={false}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <Command>
            <CommandInput
              placeholder="Search skills..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="flex-1 overflow-y-auto max-h-none">
              <CommandEmpty>No skills found.</CommandEmpty>
              {filteredGroups.map(group => (
                <CommandGroup key={group.group} heading={group.group}>
                  {group.items.map(item => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item.value)}
                      className="cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(item.value)}
                        className="mr-2"
                        readOnly
                      />
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Skills Badges */}
      {!hideBadges && selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1 transition-all duration-300">
          {selectedSkills.map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="pl-2.5 pr-1.5 py-0.5 flex items-center gap-1 text-[11px] font-medium bg-blue-500/10 border-blue-500/20 text-blue-600 rounded-lg hover:bg-blue-500/15 transition-all duration-200 animate-in fade-in zoom-in-95 duration-150"
            >
              {skill}
              <button
                onClick={(e) => { e.preventDefault(); handleSelect(skill); }}
                className="ml-1 shrink-0 hover:bg-red-500/20 text-blue-600/60 hover:text-red-400 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
              >
                <X className="h-3 w-3 pointer-events-none" />
                <span className="sr-only">Remove {skill}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
