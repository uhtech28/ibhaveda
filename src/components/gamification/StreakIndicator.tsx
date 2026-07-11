"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useEffect, useState } from "react";
import { Flame, RefreshCw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function StreakIndicator() {
    const streak = useQuery(api.gamification.getStreak);
    const restoreState = useQuery(api.streaks.getStreakRestoreState);
    const updateStreak = useMutation(api.gamification.updateStreak);
    const restoreStreak = useMutation(api.streaks.restoreStreak);
    const { toast } = useToast();
    const [hasUpdated, setHasUpdated] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const handleRestore = async () => {
        if (restoring) return;
        setRestoring(true);
        try {
            const result = await restoreStreak();
            toast({
                title: "🔥 Streak Restored!",
                description: `Back to ${result.restoredTo} days · ${result.cost} gold spent`,
                duration: 3500,
            });
        } catch (err) {
            toast({
                title: "Could not restore",
                description: err instanceof Error ? err.message : "Unknown error",
                variant: "destructive",
                duration: 3500,
            });
        } finally {
            setRestoring(false);
        }
    };

    useEffect(() => {
        // Only update once per session/mount to avoid spamming
        if (!hasUpdated && streak) {
            updateStreak().then((result) => {
                setHasUpdated(true);
                if (result?.status === "incremented") {
                    toast({
                        title: "🔥 Streak Incremented!",
                        description: `You're on a ${result.streak} day streak! Keep it up!`,
                        duration: 3000,
                    });
                }
            });
        }
    }, [updateStreak, hasUpdated, streak, toast]);

    if (streak === undefined) return null; // Loading
    if (streak === null) return null; // Not logged in

    const currentStreak = streak.currentStreak || 0;
    const isActive = currentStreak > 0;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-300 cursor-default select-none",
                        isActive ? "bg-orange-500/10 hover:bg-orange-500/20" : "bg-muted/50"
                    )}>
                        <Flame
                            className={cn(
                                "w-4 h-4 transition-all duration-500",
                                isActive ? "text-orange-500 fill-orange-500 animate-pulse" : "text-muted-foreground"
                            )}
                        />
                        <span className={cn(
                            "text-sm font-bold font-mono",
                            isActive ? "text-orange-600 dark:text-orange-400" : "text-muted-foreground"
                        )}>
                            {currentStreak}
                        </span>
                    </div>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                    <p className="font-semibold">Daily Streak</p>
                    <p className="text-muted-foreground">Log in daily to build your flame!</p>
                    {streak.longestStreak > 0 && (
                        <div className="mt-1 pt-1 border-t border-border/50">
                            <p className="text-[10px] text-muted-foreground">Best: {streak.longestStreak} days</p>
                        </div>
                    )}
                    {restoreState?.available && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                            <p className="text-[10px] mb-1.5 text-muted-foreground">
                                {restoreState.canAfford
                                    ? `Restore to ${restoreState.restoreTo} days for ${restoreState.cost} gold`
                                    : `Need ${restoreState.cost} gold to restore (you have ${restoreState.balance})`}
                            </p>
                            <button
                                type="button"
                                disabled={!restoreState.canAfford || restoring}
                                onClick={handleRestore}
                                className={cn(
                                    "flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors",
                                    restoreState.canAfford && !restoring
                                        ? "bg-orange-500/90 text-white hover:bg-orange-500"
                                        : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                <RefreshCw className={cn("h-3 w-3", restoring && "animate-spin")} />
                                {restoring ? "Restoring…" : "Restore Streak"}
                            </button>
                        </div>
                    )}
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
