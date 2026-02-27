import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Trophy } from "lucide-react"
import { useQuery } from "convex/react"
import { api } from "../../../convex/_generated/api"

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
    const levelInfo = useQuery(api.gamification.getLevelProgress, { xp: currentXP });

    const level = levelInfo?.level || 1;
    const nextLevelXP = levelInfo?.nextLevelXP || 100;
    const progress = levelInfo?.progress || 0;

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
