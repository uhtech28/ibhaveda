"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Star, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function MobileBottomNavContent() {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.getCurrentUser);

  if (
    pathname === "/" ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname?.startsWith("/map")
  ) {
    return null;
  }

  const navItems = [
    {
      name: "Feed",
      href: "/feed",
      icon: Home,
    },
    {
      name: "My Ideas",
      href: "/my-ideas",
      icon: Star,
    },
    {
      name: "Community",
      href: "/community",
      icon: Users,
    },
    {
      name: "Profile",
      href: currentUser ? `/profile/${currentUser.username}` : "/sign-in", // Fallback if not logged in, though usually protected
      icon: User,
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50 lg:hidden pb-safe">
      <nav className="grid h-16 grid-cols-4 items-center justify-items-center px-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/feed" && pathname?.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "grid h-full w-full place-items-center content-center gap-1 transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="grid h-6 w-6 place-items-center">
                <Icon className={cn("h-5 w-5", isActive && "fill-current")} />
              </span>
              <span className="text-center text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  );
}
