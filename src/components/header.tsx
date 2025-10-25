'use client'

import { Plus } from 'lucide-react'
import Link from 'next/link'
import { Logo } from '@/components/logo'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'
import React from 'react'
import { cn } from '@/lib/utils'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SearchBar } from '@/components/search/search-bar'

const menuItems = [
    { name: 'Feed', href: '/feed' },
    { name: 'My Feed', href: '/my-feed' },
    { name: 'Community', href: '/community' },
    { name: 'Profile', href: '/profile-setup' },
]

export const HeroHeader = () => {
    const [menuState, setMenuState] = React.useState(false)
    const [isScrolled, setIsScrolled] = React.useState(false)

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const handleMenuToggle = () => {
        setMenuState(!menuState)
    }

    const closeMenu = () => {
        setMenuState(false)
    }

    return (
        <header className="relative">
            <nav className="fixed top-0 left-0 right-0 z-50 w-full">
                <div className={cn(
                    'mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ease-in-out',
                    isScrolled
                        ? 'mt-2 max-w-5xl bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-lg shadow-black/5'
                        : 'mt-0 max-w-7xl bg-transparent'
                )}>
                    <div className="flex items-center justify-between h-16 lg:h-18">
                        {/* Logo */}
                        <div className="flex-shrink-0 z-20">
                            <Link
                                href="/"
                                aria-label="Interactive Ideas Home"
                                className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                                onClick={closeMenu}>
                                <Logo />
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden lg:flex lg:items-center lg:justify-center lg:flex-1 lg:px-8">
                            {/* Search Bar */}
                            <div className="max-w-md w-full mr-8">
                                <SearchBar
                                    onSearch={(query, type) => {
                                        console.log('Search query:', query, 'type:', type)
                                        // TODO: Navigate to search results page
                                    }}
                                    placeholder="Search for ideas, people, and more..."
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
                        <div className="hidden lg:flex lg:items-center lg:space-x-3">
                            <SignedOut>
                                <SignInButton>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-foreground">
                                        Login
                                    </Button>
                                </SignInButton>
                                <SignUpButton>
                                    <Button
                                        size="sm"
                                        className="shadow-sm">
                                        Sign Up
                                    </Button>
                                </SignUpButton>
                            </SignedOut>
                            <SignedIn>
                                <NotificationBell />
                                <UserButton
                                    afterSignOutUrl="/"
                                    appearance={{
                                        elements: {
                                            avatarBox: "w-8 h-8"
                                        }
                                    }}
                                />
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="sm"
                                    className="p-2 h-8 w-8"
                                    title="Create new idea"
                                >
                                    <Link href="/create-idea">
                                        <Plus className="w-4 h-4" />
                                    </Link>
                                </Button>
                            </SignedIn>
                            <ThemeToggle />
                        </div>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={handleMenuToggle}
                            aria-label={menuState ? 'Close menu' : 'Open menu'}
                            aria-expanded={menuState}
                            className="lg:hidden relative z-20 p-2 -mr-2 text-muted-foreground hover:text-foreground transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-md">
                            <span className="sr-only">
                                {menuState ? 'Close menu' : 'Open menu'}
                            </span>
                            <Menu
                                className={cn(
                                    "w-6 h-6 transition-all duration-200",
                                    menuState && "rotate-180 scale-0 opacity-0"
                                )}
                            />
                            <X
                                className={cn(
                                    "w-6 h-6 absolute inset-0 m-auto transition-all duration-200",
                                    menuState ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0"
                                )}
                            />
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Overlay */}
                <div className={cn(
                    "lg:hidden fixed inset-0 z-10 transition-all duration-300 ease-in-out",
                    menuState ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
                )}>
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        onClick={closeMenu}
                    />

                    {/* Mobile Menu Content */}
                    <div className={cn(
                        "absolute top-20 left-4 right-4 bg-background border border-border rounded-2xl shadow-xl transition-all duration-300 ease-in-out",
                        menuState ? "translate-y-0 scale-100" : "-translate-y-4 scale-95"
                    )}>
                        <div className="p-6 space-y-6">
                            {/* Mobile Search */}
                            <div className="space-y-2">
                                <SearchBar
                                    onSearch={(query, type) => {
                                        console.log('Mobile search query:', query, 'type:', type)
                                        closeMenu()
                                    }}
                                    placeholder="Search for ideas, people, and more..."
                                    className="w-full"
                                />
                            </div>

                            {/* Mobile Navigation */}
                            <nav className="space-y-1">
                                {menuItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={closeMenu}
                                        className="flex items-center px-3 py-3 text-base font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all duration-200">
                                        {item.name}
                                    </Link>
                                ))}
                            </nav>

                            {/* Mobile Actions */}
                            <div className="pt-4 border-t border-border space-y-3">
                                <div className="flex items-center justify-between">
                                    <SignedOut>
                                        <div className="flex gap-3 flex-1">
                                            <SignInButton>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1">
                                                    Login
                                                </Button>
                                            </SignInButton>
                                            <SignUpButton>
                                                <Button
                                                    size="sm"
                                                    className="flex-1">
                                                    Sign Up
                                                </Button>
                                            </SignUpButton>
                                        </div>
                                    </SignedOut>
                                    <SignedIn>
                                        <div className="flex items-center gap-3">
                                            <NotificationBell />
                                            <UserButton
                                                afterSignOutUrl="/"
                                                appearance={{
                                                    elements: {
                                                        avatarBox: "w-8 h-8"
                                                    }
                                                }}
                                            />
                                            <Button
                                                asChild
                                                variant="ghost"
                                                size="sm"
                                                className="p-2 h-8 w-8"
                                                title="Create new idea"
                                            >
                                                <Link href="/create-idea">
                                                    <Plus className="w-4 h-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </SignedIn>
                                    <ThemeToggle />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    )
}