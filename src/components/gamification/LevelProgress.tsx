import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Trophy } from "lucide-react"

interface LevelProgressProps {
    currentXP: number;
    className?: string;
    showLabel?: boolean;
}

export const LevelProgress = ({
    currentXP = 0,
    className,
    showLabel = true
}: LevelProgressProps) => {
    // Level calculation: Level = floor(sqrt(XP / 100)) + 1
    const level = Math.floor(Math.sqrt(currentXP / 100)) + 1;

    // Calculate XP thresholds
    // XP needed for current level start = 100 * (level - 1)^2
    const currentLevelStartXP = 100 * Math.pow(level - 1, 2);

    // XP needed for next level = 100 * level^2
    const nextLevelXP = 100 * Math.pow(level, 2);

    // XP earned in this level
    const xpInLevel = currentXP - currentLevelStartXP;

    // Total XP needed for this level
    const xpForLevel = nextLevelXP - currentLevelStartXP;

    // Percentage progress
    const progress = Math.min(100, Math.max(0, (xpInLevel / xpForLevel) * 100));

    return (
        <div className={cn("w-full space-y-1.5", className)}>
            {showLabel && (
                <div className="flex justify-between items-end text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-primary">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Level {level}</span>
                    </div>
                    <div className="text-muted-foreground font-mono">
                        {currentXP} <span className="text-muted-foreground/60">/</span> {nextLevelXP} XP
                    </div>
                </div>
            )}

            <Progress value={progress} className="h-2" />

            {!showLabel && (
                <div className="text-[10px] text-right text-muted-foreground pt-0.5">
                    {Math.round(progress)}% to Lvl {level + 1}
                </div>
            )}
        </div>
    )
}
