"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { industryCardGroups } from "@/lib/options";

export interface IndustryOption {
  value: string;
  label: string;
}

interface IndustriesMultiSelectProps {
  selectedIndustries: string[];
  onChange: (industries: string[]) => void;
  placeholder?: string;
  maxSelection?: number;
  singleSelect?: boolean;
  mandatoryIndustries?: string[];
  hideBadges?: boolean;
}

export function IndustriesMultiSelect({
  selectedIndustries,
  onChange,
  placeholder = "Select industries...",
  maxSelection,
  singleSelect = false,
  mandatoryIndustries = [],
  hideBadges = false,
}: IndustriesMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredGroups = useMemo(() => {
    if (!searchValue) return industryCardGroups;
    const q = searchValue.toLowerCase();
    return industryCardGroups
      .map(g => ({ ...g, items: g.items.filter(item => item.label.toLowerCase().includes(q)) }))
      .filter(g => g.items.length > 0);
  }, [searchValue]);

  const handleSelect = (value: string) => {
    let newSelected: string[];
    if (singleSelect) {
      newSelected = selectedIndustries.includes(value) ? [] : [value];
    } else {
      newSelected = selectedIndustries.includes(value)
        ? mandatoryIndustries.includes(value)
          ? selectedIndustries
          : selectedIndustries.filter(i => i !== value)
        : maxSelection && selectedIndustries.length >= maxSelection
          ? selectedIndustries
          : [...selectedIndustries, value];
    }
    onChange(newSelected);
  };

  const displayValue = selectedIndustries.length > 0
    ? singleSelect ? selectedIndustries[0] : `${selectedIndustries.length} selected`
    : placeholder;

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen} modal={true}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between gap-2 min-w-0"
          >
            <span className="truncate text-left flex-1 min-w-0">{displayValue}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
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
              placeholder="Search industries..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList className="flex-1 overflow-y-auto max-h-none">
              <CommandEmpty>No industries found.</CommandEmpty>
              {filteredGroups.map(group => (
                <CommandGroup key={group.group} heading={group.group}>
                  {group.items.map(item => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item.value)}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      {singleSelect ? (
                        <>
                          <span className="min-w-0 flex-1 truncate pr-2">{item.label}</span>
                          <span className="ml-auto flex h-4 w-4 shrink-0 items-center justify-center">
                            {selectedIndustries.includes(item.value) && (
                              <Check className="h-4 w-4 opacity-70" />
                            )}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="min-w-0 flex-1 truncate pr-2">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(item.value)}
                            className="ml-auto shrink-0"
                            readOnly
                          />
                        </>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected Industries Badges */}
      {!hideBadges && selectedIndustries.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-1 transition-all duration-300">
          {selectedIndustries.map((industry) => {
            const isMandatory = mandatoryIndustries.includes(industry);
            return (
              <Badge
                key={industry}
                variant="outline"
                className="pl-2.5 pr-1.5 py-0.5 flex items-center gap-1 max-w-full text-[11px] font-medium bg-purple-500/10 border-purple-500/20 text-purple-600 rounded-lg hover:bg-purple-500/15 transition-all duration-200 animate-in fade-in zoom-in-95 duration-150"
              >
                <span className="truncate">{industry}</span>
                {!isMandatory && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(industry); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    className="ml-1 shrink-0 hover:bg-red-500/20 text-purple-600/60 hover:text-red-400 rounded-full p-0.5 transition-colors focus:outline-none cursor-pointer"
                    aria-label={`Remove ${industry}`}
                  >
                    <X className="h-3 w-3 pointer-events-none" />
                  </button>
                )}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
