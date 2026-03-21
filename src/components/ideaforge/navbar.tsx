"use client";

import Link from "next/link";
import React from "react";
import { useQuery } from "convex/react";
import { Bell, Home, Lightbulb, Plus, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationList } from "@/components/notifications/notification-list";
import { LogoIcon } from "@/components/logo";
import { api } from "@convex/_generated/api";
import { cn } from "@/lib/utils";
import { CurrentUserProfile, displayFontClass, getInitials, shellMax, transitionBase } from "@/components/ideaforge/shared";

export function IdeaForgeNavbar({
  currentUser,
  searchQuery,
  onSearchChange,
  onOpenComposer,
}: {
  currentUser: CurrentUserProfile | null | undefined;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onOpenComposer: () => void;
}) {
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;

  const navItems = [
    { href: "/feed", label: "Feed", icon: Home },
    { href: "/my-ideas", label: "My Ideas", icon: Lightbulb },
    { href: "/community", label: "Community", icon: Users },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/7 bg-[#0A0D12]/92 backdrop-blur-xl">
      <div className={cn(shellMax, "flex items-center gap-3 px-4 py-3 xl:px-6")}>
        <Link href="/feed" className="flex items-center gap-3 rounded-full px-2 py-1 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6366F1]/30 bg-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <LogoIcon className="h-6 w-6" idSuffix="ideaforge" />
          </div>
          <div className="hidden sm:block">
            <div className={cn(displayFontClass, "text-sm font-semibold tracking-wide text-white")}>InteractiveIdeas</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C86A2]">Builder Network</div>
          </div>
        </Link>

        <div className="hidden min-w-0 flex-1 lg:block">
          <div className="mx-auto w-full max-w-[560px]">
            <SearchBar
              value={searchQuery}
              onSearch={(value) => onSearchChange(value)}
              placeholder="Search for ideas, people, tags..."
              className="[&_input]:h-12 [&_input]:rounded-full [&_input]:border-white/8 [&_input]:bg-[#111827] [&_input]:px-12 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-[#6B7280]"
            />
          </div>
        </div>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  transitionBase,
                  "group flex min-w-[88px] flex-col items-center justify-center rounded-2xl px-4 py-2 text-[#9CA3AF] hover:bg-white/[0.03] hover:text-white"
                )}
              >
                <Icon className="mb-1 h-4 w-4" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            onClick={onOpenComposer}
            className="hidden rounded-[10px] bg-[#6366F1] px-4 text-white shadow-[0_10px_32px_rgba(99,102,241,0.18)] hover:bg-[#8B5CF6] md:inline-flex"
          >
            <Plus className="h-4 w-4" />
            Post Idea
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label="Open notifications"
                className={cn(
                  transitionBase,
                  "relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/8 bg-[#111827] text-[#D1D5DB] hover:border-[#6366F1]/40 hover:text-white"
                )}
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EF4444] px-1 text-[10px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent data-notification className="w-[min(92vw,380px)] rounded-[18px] border border-white/8 bg-[#111827] p-0 shadow-[0_24px_80px_rgba(3,7,18,0.55)]" align="end">
              <ScrollArea className="h-[520px]">
                <NotificationList />
              </ScrollArea>
            </PopoverContent>
          </Popover>

          <Link href={currentUser ? `/profile/${currentUser.username}` : "/sign-in"} className="rounded-full" aria-label="Open profile">
            <Avatar className="h-11 w-11 ring-2 ring-[#6366F1]/45 ring-offset-2 ring-offset-[#0A0D12]">
              <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
              <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(currentUser?.displayName)}</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>

      <div className="border-t border-white/6 px-4 py-3 lg:hidden">
        <SearchBar
          value={searchQuery}
          onSearch={(value) => onSearchChange(value)}
          placeholder="Search for ideas, people, tags..."
          className="[&_input]:h-11 [&_input]:rounded-full [&_input]:border-white/8 [&_input]:bg-[#111827] [&_input]:px-12 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-[#6B7280]"
        />
      </div>
    </header>
  );
}

