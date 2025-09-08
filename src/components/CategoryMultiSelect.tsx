"use client";

import React, { useState, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

export interface CategoryOption {
  value: string;
  label: string;
}

export interface CategoryGroup {
  group: string;
  items: CategoryOption[];
}

const CATEGORIES: CategoryGroup[] = [
  {
    group: "Technology",
    items: [
      { value: "web-development", label: "Web Development" },
      { value: "mobile-apps", label: "Mobile Apps" },
      { value: "ai-ml", label: "AI/ML" },
      { value: "data-science", label: "Data Science" },
      { value: "cybersecurity", label: "Cybersecurity" },
      { value: "cloud-computing", label: "Cloud Computing" },
      { value: "devops", label: "DevOps" },
      { value: "blockchain", label: "Blockchain" },
      { value: "iot", label: "IoT" },
      { value: "robotics", label: "Robotics" },
    ],
  },
  {
    group: "Healthcare",
    items: [
      { value: "medicine", label: "Medicine" },
      { value: "mental-health", label: "Mental Health" },
      { value: "fitness", label: "Fitness" },
      { value: "biotechnology", label: "Biotechnology" },
      { value: "telemedicine", label: "Telemedicine" },
      { value: "healthtech", label: "HealthTech" },
      { value: "wellness", label: "Wellness" },
      { value: "nutrition", label: "Nutrition" },
      { value: "pharmacy", label: "Pharmacy" },
      { value: "nursing", label: "Nursing" },
    ],
  },
  {
    group: "Business",
    items: [
      { value: "marketing", label: "Marketing" },
      { value: "finance", label: "Finance" },
      { value: "hr", label: "HR" },
      { value: "legal", label: "Legal" },
      { value: "consulting", label: "Consulting" },
      { value: "sales", label: "Sales" },
      { value: "operations", label: "Operations" },
      { value: "e-commerce", label: "E-commerce" },
      { value: "real-estate", label: "Real Estate" },
      { value: "accounting", label: "Accounting" },
    ],
  },
  {
    group: "Education",
    items: [
      { value: "e-learning", label: "E-learning" },
      { value: "tutoring", label: "Tutoring" },
      { value: "edtech", label: "EdTech" },
      { value: "schools", label: "Schools" },
      { value: "training", label: "Training" },
      { value: "research", label: "Research" },
      { value: "skills-development", label: "Skills Development" },
      { value: "language-learning", label: "Language Learning" },
      { value: "corporate-training", label: "Corporate Training" },
    ],
  },
  {
    group: "Arts & Entertainment",
    items: [
      { value: "design", label: "Design" },
      { value: "photography", label: "Photography" },
      { value: "music", label: "Music" },
      { value: "video-production", label: "Video Production" },
      { value: "film", label: "Film" },
      { value: "animation", label: "Animation" },
      { value: "writing", label: "Writing" },
      { value: "digital-media", label: "Digital Media" },
      { value: "gaming", label: "Gaming" },
      { value: "performing-arts", label: "Performing Arts" },
    ],
  },
  {
    group: "Transportation",
    items: [
      { value: "automotive", label: "Automotive" },
      { value: "aviation", label: "Aviation" },
      { value: "logistics", label: "Logistics" },
      { value: "delivery", label: "Delivery" },
      { value: "ride-sharing", label: "Ride Sharing" },
      { value: "public-transit", label: "Public Transit" },
      { value: "shipping", label: "Shipping" },
      { value: "electric-vehicles", label: "Electric Vehicles" },
      { value: "urban-planning", label: "Urban Planning" },
    ],
  },
  {
    group: "Additional",
    items: [
      { value: "agriculture", label: "Agriculture" },
      { value: "energy", label: "Energy" },
      { value: "environment", label: "Environment" },
      { value: "retail", label: "Retail" },
      { value: "manufacturing", label: "Manufacturing" },
      { value: "hospitality", label: "Hospitality" },
      { value: "government", label: "Government" },
      { value: "non-profit", label: "Non-Profit" },
    ],
  },
];

interface CategoryMultiSelectProps {
  selectedCategories: string[];
  onChange: (categories: string[]) => void;
  placeholder?: string;
  maxSelection?: number;
}

export function CategoryMultiSelect({
  selectedCategories,
  onChange,
  placeholder = "Select categories...",
  maxSelection,
}: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredCategories = useMemo(() => {
    if (!searchValue) return CATEGORIES;

    return CATEGORIES.map(group => ({
      ...group,
      items: group.items.filter(item =>
        item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
        item.value.toLowerCase().includes(searchValue.toLowerCase())
      ),
    })).filter(group => group.items.length > 0);
  }, [searchValue]);

  const handleSelect = (value: string) => {
    const newSelected = selectedCategories.includes(value)
      ? selectedCategories.filter(cat => cat !== value)
      : maxSelection && selectedCategories.length >= maxSelection
        ? selectedCategories
        : [...selectedCategories, value];
    onChange(newSelected);
  };

  const displayValue = selectedCategories.length > 0
    ? `${selectedCategories.length} selected`
    : placeholder;

  return (
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
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search categories..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>No categories found.</CommandEmpty>
            {filteredCategories.map(group => (
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
                      checked={selectedCategories.includes(item.value)}
                      className="mr-2"
                      readOnly
                    />
                    {item.label}
                    {selectedCategories.includes(item.value) && (
                      <Check className="ml-auto h-4 w-4 opacity-50" />
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {/* Mobile view with collapsed groups */}
            <div className="md:hidden">
              <CommandGroup>
                <div className="px-1 py-2 text-sm font-semibold text-muted-foreground">All Categories</div>
                {filteredCategories.flatMap(group =>
                  group.items.map(item => (
                    <CommandItem
                      key={item.value}
                      value={item.value}
                      onSelect={() => handleSelect(item.value)}
                      className="cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(item.value)}
                        className="mr-2"
                        readOnly
                      />
                      <span className="text-xs text-muted-foreground mr-2">[{group.group}]</span>
                      {item.label}
                      {selectedCategories.includes(item.value) && (
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
  );
}