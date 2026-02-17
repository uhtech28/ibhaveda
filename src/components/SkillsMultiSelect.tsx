"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { skillCardOptions } from "@/lib/options";

export interface SkillOption {
  value: string;
  label: string;
}

// Group skills for better organization
const groupSkills = (skills: SkillOption[]) => {
  const groups: { [key: string]: SkillOption[] } = {};

  skills.forEach(skill => {
    // Categorize skills based on their content
    let group = "Other";

    if (skill.label.includes("Engineering") || skill.label.includes("Mathematics") || skill.label.includes("Architecture")) {
      group = "Engineering & Technical";
    } else if (skill.label.includes("Physics") || skill.label.includes("Chemistry") || skill.label.includes("Biology") || skill.label.includes("Science")) {
      group = "Sciences";
    } else if (skill.label.includes("Arts") || skill.label.includes("Painting") || skill.label.includes("Photography") || skill.label.includes("Music") || skill.label.includes("Film") || skill.label.includes("Fashion") || skill.label.includes("Designer") || skill.label.includes("Animator")) {
      group = "Arts & Design";
    } else if (skill.label.includes("Finance") || skill.label.includes("Management") || skill.label.includes("Law") || skill.label.includes("Consultancy") || skill.label.includes("Accountancy") || skill.label.includes("Entrepreneurs")) {
      group = "Business & Services";
    } else if (skill.label.includes("Healthcare") || skill.label.includes("Medicine") || skill.label.includes("Psychology")) {
      group = "Healthcare & Social";
    } else if (skill.label.includes("Services") || skill.label.includes("Hospitality") || skill.label.includes("Training") || skill.label.includes("Research")) {
      group = "Professional Services";
    } else if (skill.label.includes("Sociology") || skill.label.includes("Journalism") || skill.label.includes("History") || skill.label.includes("Geography") || skill.label.includes("Economics") || skill.label.includes("Philosophy")) {
      group = "Social Sciences";
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(skill);
  });

  return Object.entries(groups).map(([group, items]) => ({ group, items }));
};

const SKILL_GROUPS = groupSkills(skillCardOptions);

interface SkillsMultiSelectProps {
  selectedSkills: string[];
  onChange: (skills: string[]) => void;
  placeholder?: string;
  maxSelection?: number;
  mandatorySkills?: string[];
}

export function SkillsMultiSelect({
  selectedSkills,
  onChange,
  placeholder = "Select skills...",
  maxSelection,
  mandatorySkills = [],
}: SkillsMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredSkills = useMemo(() => {
    if (!searchValue) return SKILL_GROUPS;

    return SKILL_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.value.toLowerCase().includes(searchValue.toLowerCase())
      ),
    })).filter(group => group.items.length > 0);
  }, [searchValue]);

  const handleSelect = (value: string) => {
    const newSelected = selectedSkills.includes(value)
      ? mandatorySkills.includes(value)
        ? selectedSkills // Cannot remove mandatory skills
        : selectedSkills.filter(skill => skill !== value)
      : maxSelection && selectedSkills.length >= maxSelection
        ? selectedSkills
        : [...selectedSkills, value];
    onChange(newSelected);
  };

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {selectedSkills.length > 0 ? `${selectedSkills.length} selected` : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[90vw] sm:w-[400px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search skills..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No skills found.</CommandEmpty>
              {filteredSkills.map(group => (
                <CommandGroup key={group.group} heading={group.group} className="hidden md:block">
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
                      {selectedSkills.includes(item.value) && (
                        <Check className="ml-auto h-4 w-4 opacity-50" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              {/* Mobile view with collapsed groups */}
              <div className="md:hidden">
                <CommandGroup>
                  <div className="px-1 py-2 text-sm font-semibold text-muted-foreground">All Skills</div>
                  {filteredSkills.flatMap(group =>
                    group.items.map(item => (
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
                        <span className="text-xs text-muted-foreground mr-2">[{group.group}]</span>
                        {item.label}
                        {selectedSkills.includes(item.value) && (
                          <Check className="ml-auto h-4 w-4 opacity-50" />
                        )}
                      </CommandItem>
                    ))
                  )}
                </CommandGroup>
              </div>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Skills Badges */}
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSkills.map((skill) => {
            return (
              <Badge key={skill} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                {skill}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleSelect(skill);
                  }}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors focus:outline-none"
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  <span className="sr-only">Remove {skill}</span>
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}