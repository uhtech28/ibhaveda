'use client'

import { User, LogOut } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignedIn, SignedOut, SignInButton, SignUpButton, useClerk } from '@clerk/nextjs'
import React from 'react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SearchBar } from '@/components/search/search-bar'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MobileBottomNav } from '@/components/mobile-bottom-nav'
import { StreakIndicator } from '@/components/gamification/StreakIndicator'
import { PointBalance } from '@/components/gamification/PointBalance'

const menuItems = [
    { name: 'Feed', href: '/feed' },
    { name: 'My Ideas', href: '/my-feed' },
    { name: 'Community', href: '/community' },
]

export const HeroHeader = ({
    searchQuery,
    onSearchChange
}: {
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
}) => {
    const [isScrolled, setIsScrolled] = React.useState(false)
    const { signOut } = useClerk()
    const currentUser = useQuery(api.users.getCurrentUser)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return (
        <header className="relative">
            <nav className="fixed top-0 left-0 right-0 z-50 w-full">
                <div className={cn(
                    'mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out',
                    isScrolled
                        ? 'mt-0 lg:mt-2 max-w-5xl bg-background/80 backdrop-blur-xl border-b lg:border border-border/50 lg:rounded-2xl shadow-lg shadow-black/5'
                        : 'mt-0 max-w-5xl bg-background/80 backdrop-blur-xl lg:bg-transparent border-b lg:border-none border-border/50'
                )}>
                    <div className="flex items-center justify-between h-16 lg:h-18">
                        {/* Logo */}
                        <div className="flex-shrink-0 z-20">
                            <Link
                                href="/"
                                aria-label="Interactive Ideas Home"
                                className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg">
                                <Logo />
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex lg:items-center lg:justify-center lg:flex-1 lg:px-8">
                            {/* Search Bar */}
                            <div className="max-w-md w-full mr-8">
                                <SearchBar
                                    value={searchQuery}
                                    onSearch={(query) => {
                                        onSearchChange?.(query)
                                    }}
                                    placeholder="Search for ideas..."
                                    className="w-full"
                                />
                            </div>

                            {/* Navigation Menu */}
                            <nav className="flex items-center space-x-8">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md px-2 py-1">
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden lg:flex items-center gap-4">
                            <SignedOut>
                                <div className="flex gap-3">
                                    <SignInButton>
                                        <Button variant="ghost" size="sm">
                                            Login
                                        </Button>
                                    </SignInButton>
                                    <SignUpButton>
                                        <Button size="sm">
                                            Sign Up
                                        </Button>
                                    </SignUpButton>
                                </div>
                            </SignedOut>
                            <SignedIn>
                                <div className="flex items-center gap-3">
                                    <PointBalance />
                                    <StreakIndicator />
                                    <NotificationBell />

                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={currentUser?.avatar} alt={currentUser?.displayName} />
                                                    <AvatarFallback>{currentUser?.displayName?.charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-56" align="end" forceMount>
                                            <div className="grid gap-4">
                                                <div className="font-medium truncate">
                                                    {currentUser?.displayName}
                                                    <p className="text-xs text-muted-foreground font-normal truncate">
                                                        @{currentUser?.username}
                                                    </p>
                                                </div>
                                                <div className="grid gap-2">
                                                    <Button asChild variant="ghost" className="justify-start gap-2 px-2 w-full">
                                                        <Link href={`/profile/${currentUser?.username}`}>
                                                            <User className="h-4 w-4" />
                                                            <span>Profile Page</span>
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        className="justify-start gap-2 px-2 w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        onClick={() => signOut()}
                                                    >
                                                        <LogOut className="h-4 w-4" />
                                                        <span>Sign Out</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </SignedIn>
                        </div>

                        {/* Mobile Actions (Top Bar) */}
                        <div className="flex lg:hidden items-center gap-2">
                            {/* Mobile Search - Compact */}
                            <div className="w-32 sm:w-48">
                                <SearchBar
                                    value={searchQuery}
                                    onSearch={(query, type) => {
                                        onSearchChange?.(query)
                                    }}
                                    placeholder="Search..."
                                    className="w-full h-9 text-xs"
                                />
                            </div>

                            <SignedIn>
                                <PointBalance />
                                <StreakIndicator />
                                <NotificationBell />
                            </SignedIn>
                            <ThemeToggle />
                            <SignedOut>
                                <SignInButton>
                                    <Button size="sm" variant="ghost" className="px-2">
                                        Login
                                    </Button>
                                </SignInButton>
                            </SignedOut>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <MobileBottomNav />
        </header>
    )
}