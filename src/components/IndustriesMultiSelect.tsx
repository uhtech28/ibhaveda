"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { industryCardOptions } from "@/lib/options";

export interface IndustryOption {
  value: string;
  label: string;
}

// Group industries for better organization
const groupIndustries = (industries: IndustryOption[]) => {
  const groups: { [key: string]: IndustryOption[] } = {};

  industries.forEach(industry => {
    // Categorize industries based on their content
    let group = "Other";

    if (industry.label.includes("Software") || industry.label.includes("Electronics") || industry.label.includes("Telecommunication")) {
      group = "Technology & Digital";
    } else if (industry.label.includes("Healthcare") || industry.label.includes("Medicine")) {
      group = "Healthcare";
    } else if (industry.label.includes("Finance") || industry.label.includes("Insurance")) {
      group = "Financial Services";
    } else if (industry.label.includes("Manufacturing") || industry.label.includes("Chemicals") || industry.label.includes("Metals") || industry.label.includes("Construction")) {
      group = "Manufacturing & Industrial";
    } else if (industry.label.includes("Media") || industry.label.includes("Entertainment") || industry.label.includes("Film")) {
      group = "Media & Entertainment";
    } else if (industry.label.includes("Automobiles") || industry.label.includes("Transportation") || industry.label.includes("Aerospace") || industry.label.includes("Aviation")) {
      group = "Transportation & Aerospace";
    } else if (industry.label.includes("Food") || industry.label.includes("Beverages") || industry.label.includes("Retail") || industry.label.includes("Houseware")) {
      group = "Consumer Goods & Retail";
    } else if (industry.label.includes("Energy") || industry.label.includes("Public Utilities")) {
      group = "Energy & Utilities";
    } else if (industry.label.includes("Real Estate") || industry.label.includes("Construction")) {
      group = "Real Estate & Construction";
    } else if (industry.label.includes("Hospitality") || industry.label.includes("Travelling") || industry.label.includes("Tourism")) {
      group = "Hospitality & Tourism";
    } else if (industry.label.includes("Agriculture") || industry.label.includes("Fishing") || industry.label.includes("Animal Husbandry")) {
      group = "Agriculture";
    } else if (industry.label.includes("Defence") || industry.label.includes("Aerospace")) {
      group = "Defence & Aerospace";
    } else if (industry.label.includes("Education") || industry.label.includes("Academia")) {
      group = "Education";
    } else if (industry.label.includes("Law") || industry.label.includes("Legal")) {
      group = "Legal Services";
    } else if (industry.label.includes("General Management") || industry.label.includes("Sales") || industry.label.includes("Marketing") || industry.label.includes("Consultancy")) {
      group = "Business Services";
    } else if (industry.label.includes("Social Services") || industry.label.includes("Environmentalism")) {
      group = "Social & Environmental";
    } else if (industry.label.includes("Artistic") || industry.label.includes("Professional Services")) {
      group = "Professional Services";
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(industry);
  });

  return Object.entries(groups).map(([group, items]) => ({ group, items }));
};

const INDUSTRY_GROUPS = groupIndustries(industryCardOptions);

interface IndustriesMultiSelectProps {
  selectedIndustries: string[];
  onChange: (industries: string[]) => void;
  placeholder?: string;
  maxSelection?: number;
  singleSelect?: boolean;
  mandatoryIndustries?: string[];
}

export function IndustriesMultiSelect({
  selectedIndustries,
  onChange,
  placeholder = "Select industries...",
  maxSelection,
  singleSelect = false,
  mandatoryIndustries = [],
}: IndustriesMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredIndustries = useMemo(() => {
    if (!searchValue) return INDUSTRY_GROUPS;

    return INDUSTRY_GROUPS.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.value.toLowerCase().includes(searchValue.toLowerCase())
      ),
    })).filter(group => group.items.length > 0);
  }, [searchValue]);

  const handleSelect = (value: string) => {
    let newSelected: string[];

    if (singleSelect) {
      // Single select mode
      newSelected = selectedIndustries.includes(value) ? [] : [value];
    } else {
      // Multi select mode
      newSelected = selectedIndustries.includes(value)
        ? mandatoryIndustries.includes(value)
          ? selectedIndustries // Cannot remove mandatory industries
          : selectedIndustries.filter(industry => industry !== value)
        : maxSelection && selectedIndustries.length >= maxSelection
          ? selectedIndustries
          : [...selectedIndustries, value];
    }

    onChange(newSelected);
  };

  const displayValue = selectedIndustries.length > 0
    ? singleSelect
      ? selectedIndustries[0]
      : `${selectedIndustries.length} selected`
    : placeholder;

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
            {displayValue}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search industries..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No industries found.</CommandEmpty>
              {filteredIndustries.map(group => (
                <CommandGroup key={group.group} heading={group.group} className="hidden md:block">
                  {group.items.map(item => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item.value)}
                      className="cursor-pointer"
                    >
                      {singleSelect ? (
                        <>
                          {selectedIndustries.includes(item.value) && (
                            <Check className="mr-2 h-4 w-4 opacity-50" />
                          )}
                          {item.label}
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={selectedIndustries.includes(item.value)}
                            className="mr-2"
                            readOnly
                          />
                          {item.label}
                          {selectedIndustries.includes(item.value) && (
                            <Check className="ml-auto h-4 w-4 opacity-50" />
                          )}
                        </>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
              {/* Mobile view with collapsed groups */}
              <div className="md:hidden">
                <CommandGroup>
                  <div className="px-1 py-2 text-sm font-semibold text-muted-foreground">All Industries</div>
                  {filteredIndustries.flatMap(group =>
                    group.items.map(item => (
                      <CommandItem
                        key={item.value}
                        value={item.value}
                        onSelect={() => handleSelect(item.value)}
                        className="cursor-pointer"
                      >
                        {singleSelect ? (
                          <>
                            {selectedIndustries.includes(item.value) && (
                              <Check className="mr-2 h-4 w-4 opacity-50" />
                            )}
                            {item.label}
                          </>
                        ) : (
                          <>
                            <input
                              type="checkbox"
                              checked={selectedIndustries.includes(item.value)}
                              className="mr-2"
                              readOnly
                            />
                            {item.label}
                            {selectedIndustries.includes(item.value) && (
                              <Check className="ml-auto h-4 w-4 opacity-50" />
                            )}
                          </>
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

      {/* Selected Industries Badges */}
      {selectedIndustries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIndustries.map((industry) => (
            <Badge key={industry} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
              {industry}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleSelect(industry);
                }}
                className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors focus:outline-none"
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                <span className="sr-only">Remove {industry}</span>
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}