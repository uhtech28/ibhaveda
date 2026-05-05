'use client'

import { LogOut, Plus, Home, Users, ArrowLeft, Search, Bell } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useClerk } from '@clerk/nextjs'
import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SearchBar } from '@/components/search/search-bar'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Clean lightbulb icon (no rays/dashes around the bulb).
// lucide-react's <Lightbulb /> includes the rays which look noisy at small
// sizes — this is a slimmer custom replacement used for "My Ideas".
const IdeaBulb = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
    >
        <path d="M9 18h6" />
        <path d="M10 21h4" />
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.9.7 1.5 1.7 1.5 2.8V18h4v-1.3c0-1.1.6-2.1 1.5-2.8A6 6 0 0 0 12 3Z" />
    </svg>
)

const menuItems = [
    { name: 'Feed', href: '/feed', icon: Home },
    { name: 'My Ideas', href: '/my-ideas', icon: IdeaBulb },
    { name: 'Community', href: '/community', icon: Users },
]

const transitionBase = "transition-all duration-200 ease-in-out"

export const HeroHeader = ({
    searchQuery,
    onSearchChange,
}: {
    searchQuery?: string
    onSearchChange?: (query: string) => void
    onOpenHierarchy?: () => void
    onOpenTodos?: () => void
    onOpenCalendar?: () => void
}) => {
    const [isScrolled, setIsScrolled] = useState(false)
    const { signOut } = useClerk()
    const currentUser = useQuery(api.users.getCurrentUser)
    const pathname = usePathname()
    const router = useRouter()

    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const mobileSearchRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        if (mobileSearchOpen) {
            const input = mobileSearchRef.current?.querySelector('input')
            input?.focus()
        }
    }, [mobileSearchOpen])

    useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 20)
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const isActive = (href: string) =>
        pathname === href || (href !== '/' && pathname?.startsWith(href))

    const handleSearch = useCallback(
        (query: string) => {
            if (onSearchChange) {
                onSearchChange(query)
            } else if (query.trim()) {
                router.push(`/feed?q=${encodeURIComponent(query.trim())}`)
            }
        },
        [onSearchChange, router]
    )

    const initials = (currentUser?.displayName ?? currentUser?.username ?? "U")
        .toString()
        .split(/\s+/)
        .map((s) => s.charAt(0))
        .join("")
        .slice(0, 2)
        .toUpperCase()

    return (
        <header className="relative">
            <nav
                className={cn(
                    'fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 ease-in-out',
                    'bg-[#0A0D12]/92 backdrop-blur-xl border-b border-white/7',
                    isScrolled && 'shadow-[0_4px_24px_-8px_rgba(0,0,0,0.6)]'
                )}
            >
                {/* MOBILE BAR — matches IdeaForgeNavbar exactly */}
                <div className="flex items-center gap-2 px-3 py-2 lg:hidden">
                    {mobileSearchOpen ? (
                        <>
                            <button
                                type="button"
                                onClick={() => setMobileSearchOpen(false)}
                                aria-label="Close search"
                                className={cn(
                                    transitionBase,
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white"
                                )}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div ref={mobileSearchRef} className="min-w-0 flex-1">
                                <SearchBar
                                    value={searchQuery}
                                    onSearch={handleSearch}
                                    placeholder="Search for ideas, people, tags..."
                                    className="[&_input]:h-9 [&_input]:rounded-full [&_input]:border-white/8 [&_input]:bg-[#111827] [&_input]:pl-9 [&_input]:pr-3 [&_input]:text-sm [&_input]:text-white [&_input]:placeholder:text-[#6B7280]"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/" aria-label="Home" className="shrink-0">
                                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#6366F1]/30 bg-[#111827] overflow-hidden">
                                    <Image
                                        src="/logo.png"
                                        alt=""
                                        width={36}
                                        height={36}
                                        className="h-full w-full object-cover"
                                        priority
                                    />
                                </div>
                            </Link>

                            {/* Compact search pill */}
                            <button
                                type="button"
                                onClick={() => setMobileSearchOpen(true)}
                                aria-label="Open search"
                                className={cn(
                                    transitionBase,
                                    "flex flex-1 min-w-0 items-center gap-2 h-9 px-3 rounded-full border border-white/8 bg-[#111827]/60 text-[#9CA3AF] hover:bg-[#111827] hover:text-white"
                                )}
                            >
                                <Search className="h-4 w-4 shrink-0" />
                                <span className="text-sm truncate">Search</span>
                            </button>

                            <SignedOut>
                                <div className="flex shrink-0 gap-1">
                                    <SignInButton>
                                        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                                            Login
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton>
                                        <Button size="sm">Sign Up</Button>
                                    </SignUpButton>
                                </div>
                            </SignedOut>

                            <SignedIn>
                                <Link href="/create-idea" aria-label="Post idea" className="shrink-0">
                                    <button
                                        type="button"
                                        className={cn(
                                            transitionBase,
                                            "flex h-9 w-9 items-center justify-center rounded-full text-[#D1D5DB] hover:bg-white/[0.06] hover:text-white"
                                        )}
                                    >
                                        <Plus className="h-5 w-5" />
                                    </button>
                                </Link>

                                <div className="shrink-0 [&_button]:h-9 [&_button]:w-9 [&_button]:text-[#D1D5DB] [&_button:hover]:bg-white/[0.06] [&_button:hover]:text-white">
                                    <NotificationBell />
                                </div>

                                <Popover>
                                    <PopoverTrigger asChild>
                                        <button
                                            type="button"
                                            className="shrink-0 rounded-full"
                                            aria-label="Open profile"
                                        >
                                            <Avatar className="h-7 w-7">
                                                <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                                                <AvatarFallback className="bg-[#1B2440] text-[10px] font-semibold text-white">
                                                    {initials}
                                                </AvatarFallback>
                                            </Avatar>
                                        </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56" align="end" forceMount>
                                        <div className="grid gap-2">
                                            <Link
                                                href={`/profile/${currentUser?.username}`}
                                                className="font-medium truncate p-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                                            >
                                                {currentUser?.displayName}
                                                <p className="text-xs text-muted-foreground font-normal truncate">
                                                    @{currentUser?.username}
                                                </p>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => signOut()}
                                            >
                                                <LogOut className="h-4 w-4" />
                                                <span>Sign Out</span>
                                            </Button>
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </SignedIn>
                        </>
                    )}
                </div>

                {/* DESKTOP BAR */}
                <div className="hidden w-full px-4 sm:px-6 lg:px-8 lg:block">
                    <div className="flex items-center justify-between h-16 gap-3 lg:gap-6">
                        <Link
                            href="/"
                            aria-label="InteractiveIdeas Home"
                            className="flex items-center gap-3 flex-shrink-0 group focus:outline-none"
                        >
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#6366F1]/30 bg-[#111827] shadow-[0_0_0_1px_rgba(255,255,255,0.03)] overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt=""
                                    width={44}
                                    height={44}
                                    className="h-full w-full object-cover"
                                    priority
                                />
                            </div>
                            <div className="hidden sm:flex flex-col items-start leading-none">
                                <span className="text-[15px] font-bold tracking-tight text-white">
                                    InteractiveIdeas
                                </span>
                                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                                    Builder Network
                                </span>
                            </div>
                        </Link>

                        <div className="flex flex-1 max-w-xl mx-2 lg:mx-6">
                            <SearchBar
                                value={searchQuery}
                                onSearch={handleSearch}
                                placeholder="Search for ideas, people, tags..."
                                className="w-full"
                            />
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                            <nav className="flex items-center gap-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon
                                    const active = isActive(item.href)
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            aria-label={item.name}
                                            title={item.name}
                                            className={cn(
                                                'relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200',
                                                active
                                                    ? 'text-white bg-white/[0.06]'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            {active && (
                                                <span
                                                    aria-hidden
                                                    className="absolute left-2 right-2 -bottom-px h-px bg-gradient-to-r from-transparent via-violet-400 to-transparent shadow-[0_0_10px_rgba(167,139,250,0.7)]"
                                                />
                                            )}
                                        </Link>
                                    )
                                })}
                            </nav>

                            <SignedOut>
                                <div className="flex gap-2 ml-1">
                                    <SignInButton>
                                        <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                                            Login
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton>
                                        <Button size="sm">Sign Up</Button>
                                    </SignUpButton>
                                </div>
                            </SignedOut>

                            <SignedIn>
                                <div className="flex items-center gap-2 ml-1">
                                    <Link href="/create-idea">
                                        <button
                                            type="button"
                                            aria-label="Post Idea"
                                            title="Post Idea"
                                            className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] bg-[#6366F1] text-white shadow-[0_10px_32px_rgba(99,102,241,0.18)] hover:bg-[#8B5CF6] transition-colors"
                                        >
                                            <Plus className="h-5 w-5" />
                                        </button>
                                    </Link>

                                    <NotificationBell />

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button
                                                type="button"
                                                className="rounded-full"
                                                aria-label="Open profile"
                                            >
                                                <Avatar className="h-11 w-11 ring-2 ring-[#6366F1]/45 ring-offset-2 ring-offset-[#0A0D12]">
                                                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                                                    <AvatarFallback className="bg-[#1B2440] text-white">
                                                        {initials}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56" align="end" forceMount>
                                            <div className="grid gap-2">
                                                <Link
                                                    href={`/profile/${currentUser?.username}`}
                                                    className="font-medium truncate p-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                                                >
                                                    {currentUser?.displayName}
                                                    <p className="text-xs text-muted-foreground font-normal truncate">
                                                        @{currentUser?.username}
                                                    </p>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => signOut()}
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    <span>Sign Out</span>
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </SignedIn>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}
