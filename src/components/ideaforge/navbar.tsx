"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { ArrowLeft, Home, LogOut, Plus, Search, Users } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import Image from "next/image";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SearchBar } from "@/components/search/search-bar";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { cn } from "@/lib/utils";
import { CurrentUserProfile, displayFontClass, getInitials, shellMax, transitionBase } from "@/components/ideaforge/shared";

const IdeaBulb = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M9 18h6" />
    <path d="M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.9.7 1.5 1.7 1.5 2.8V18h4v-1.3c0-1.1.6-2.1 1.5-2.8A6 6 0 0 0 12 3Z" />
  </svg>
);

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
  const pathname = usePathname();

  const navMenu = [
    { name: "Feed", href: "/feed", icon: Home },
    { name: "My Ideas", href: "/my-ideas", icon: IdeaBulb },
    { name: "Communities", href: "/community", icon: Users },
  ];

  const isMenuActive = (href: string) =>
    pathname === href || (href !== "/" && pathname?.startsWith(href));

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const mobileSearchRef = useRef<HTMLDivElement | null>(null);
  const { signOut } = useClerk();

  useEffect(() => {
    if (mobileSearchOpen) {
      const input = mobileSearchRef.current?.querySelector("input");
      input?.focus();
    }
  }, [mobileSearchOpen]);

  return (
    <header className="fixed inset-x-0 top-0 z-50 h-14 lg:h-16 border-b border-white/7 bg-[#0A0D12]/92 backdrop-blur-xl overflow-hidden">
      {/* Mobile / tablet compact bar */}
      <div className="flex h-14 items-center gap-2 px-3 lg:hidden">
        {mobileSearchOpen ? (
          <>
            <button type="button" onClick={() => setMobileSearchOpen(false)} aria-label="Close search" className={cn(transitionBase, "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white")}>
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div ref={mobileSearchRef} className="min-w-0 flex-1">
              <SearchBar value={searchQuery} onSearch={(value) => onSearchChange(value)} placeholder="Search for ideas, people, tags..." className="[&_input]:h-9 [&_input]:rounded-full [&_input]:border-white/8 [&_input]:bg-[#111827] [&_input]:pl-9 [&_input]:pr-3 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-[#6B7280]" />
            </div>
          </>
        ) : (
          <>
            <Link href="/feed" aria-label="Home" className="shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#6366F1]/30 bg-[#111827] overflow-hidden">
                <Image src="/logo.png" alt="" width={36} height={36} className="h-full w-full object-cover" priority />
              </div>
            </Link>

            <button type="button" onClick={() => setMobileSearchOpen(true)} aria-label="Open search" className={cn(transitionBase, "flex flex-1 min-w-0 items-center gap-2 h-9 px-3 rounded-full border border-white/8 bg-[#111827]/60 text-[#9CA3AF] hover:bg-[#111827] hover:text-white")}>
              <Search className="h-4 w-4 shrink-0" />
              <span className="text-sm truncate">Search</span>
            </button>

            <button type="button" onClick={onOpenComposer} aria-label="Post idea" className={cn(transitionBase, "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white")}>
              <Plus className="h-5 w-5" />
            </button>

            <div className="shrink-0 [&_button]:h-9 [&_button]:w-9 [&_button]:text-[#D1D5DB] [&_button:hover]:bg-white/[0.06] [&_button:hover]:text-white">
              <NotificationBell />
            </div>

            <Popover>
              <PopoverTrigger asChild>
                <button type="button" className="shrink-0 rounded-full" aria-label="Open profile menu">
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                    <AvatarFallback className="bg-[#1B2440] text-[10px] font-semibold text-white">{getInitials(currentUser?.displayName)}</AvatarFallback>
                  </Avatar>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56" align="end" forceMount>
                <div className="grid gap-2">
                  <Link href={currentUser ? `/profile/${currentUser.username}` : "/sign-in"} className="font-medium truncate p-2 -mx-2 rounded-md hover:bg-muted transition-colors">
                    {currentUser?.displayName ?? "Profile"}
                    {currentUser?.username && (<p className="text-xs text-muted-foreground font-normal truncate">@{currentUser.username}</p>)}
                  </Link>
                  <Button variant="ghost" className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut()}>
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </>
        )}
      </div>

      {/* Desktop bar */}
      <div className={cn(shellMax, "hidden h-16 items-center gap-3 px-4 lg:flex xl:px-6")}>
        <Link href="/feed" className="flex items-center gap-3 rounded-full px-2 py-1 text-white">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6366F1]/30 bg-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden">
            <Image src="/logo.png" alt="" width={44} height={44} className="h-full w-full object-cover" priority />
          </div>
          <div className="hidden sm:block">
            <div className={cn(displayFontClass, "text-sm font-semibold tracking-wide text-white")}>InteractiveIdeas</div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-[#7C86A2]">Builder Network</div>
          </div>
        </Link>

        <div className="hidden min-w-0 flex-1 lg:block">
          <div className="mx-auto w-full max-w-[560px]">
            <SearchBar value={searchQuery} onSearch={(value) => onSearchChange(value)} placeholder="Search for ideas, people, tags..." className="[&_input]:h-12 [&_input]:rounded-full [&_input]:border-white/8 [&_input]:bg-[#111827] [&_input]:px-12 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-[#6B7280]" />
          </div>
        </div>

        <Button type="button" onClick={onOpenComposer} aria-label="Post Idea" title="Post Idea" className="hidden lg:inline-flex items-center justify-center w-10 h-10 p-0 rounded-[10px] bg-[#6366F1] text-white shadow-[0_10px_32px_rgba(99,102,241,0.18)] hover:bg-[#8B5CF6]">
          <Plus className="h-5 w-5" />
        </Button>

        <nav className="hidden lg:flex items-center gap-1">
          {navMenu.map((item) => {
            const Icon = item.icon;
            const active = isMenuActive(item.href);
            return (
              <Link key={item.href} href={item.href} aria-label={item.name} title={item.name} className={cn("relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200", active ? "text-white bg-white/[0.06]" : "text-[#9CA3AF] hover:text-white hover:bg-white/[0.04]")}>
                <Icon className="h-5 w-5" />
                {active && (<span aria-hidden className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-transparent via-[#8B5CF6] to-transparent shadow-[0_0_10px_rgba(139,92,246,0.7)]" />)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <NotificationBell />
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="rounded-full" aria-label="Open profile menu">
                <Avatar className="h-11 w-11 ring-2 ring-[#6366F1]/45 ring-offset-2 ring-offset-[#0A0D12]">
                  <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                  <AvatarFallback className="bg-[#1B2440] text-white">{getInitials(currentUser?.displayName)}</AvatarFallback>
                </Avatar>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end" forceMount>
              <div className="grid gap-2">
                <Link href={currentUser ? `/profile/${currentUser.username}` : "/sign-in"} className="font-medium truncate p-2 -mx-2 rounded-md hover:bg-muted transition-colors">
                  {currentUser?.displayName ?? "Profile"}
                  {currentUser?.username && (<p className="text-xs text-muted-foreground font-normal truncate">@{currentUser.username}</p>)}
                </Link>
                <Button variant="ghost" className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => signOut()}>
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}