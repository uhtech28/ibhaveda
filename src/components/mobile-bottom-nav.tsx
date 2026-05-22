"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Star, Users, User, Map } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

function MobileBottomNavContent() {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.getCurrentUser);

  if (
    pathname === "/" ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up")
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
      name: "World Map",
      href: "/map",
      icon: Map,
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
      <nav className="flex items-center justify-around h-16 px-2">
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
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.name}</span>
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
