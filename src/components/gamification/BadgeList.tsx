import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Lock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";

interface BadgeListProps {
    userId: Id<"users">;
}

export const BadgeList = ({ userId }: BadgeListProps) => {
    // Get all badges definitions
    const allBadges = useQuery(api.badges.getBadges);
    // Get user's earned badges
    const userBadges = useQuery(api.badges.getUserBadges, { userId });

    if (!allBadges) return <div className="animate-pulse h-24 bg-muted/20 rounded-xl" />;

    const earnedBadgeIds = new Set(userBadges?.map((b: any) => b._id));

    return (
        <Card className="border-border/40 bg-card/50">
            <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Medal className="w-5 h-5 text-primary" />
                    Badges
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
                    {allBadges.map((badge: any) => {
                        const isEarned = earnedBadgeIds.has(badge._id);
                        // Dynamic icon rendering
                        const IconComponent = (LucideIcons as any)[badge.icon] || Medal;

                        return (
                            <TooltipProvider key={badge._id}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className={cn(
                                            "aspect-square flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300",
                                            isEarned
                                                ? "bg-primary/10 border-primary/30 text-primary shadow-sm"
                                                : "bg-muted/30 border-transparent text-muted-foreground opacity-60 grayscale"
                                        )}>
                                            <div className={cn(
                                                "p-2 rounded-full mb-1",
                                                isEarned ? "bg-primary/20" : "bg-muted/50"
                                            )}>
                                                {isEarned ? (
                                                    <IconComponent className="w-5 h-5" />
                                                ) : (
                                                    <Lock className="w-4 h-4" />
                                                )}
                                            </div>
                                            {/* <span className="text-[10px] font-medium text-center leading-tight line-clamp-2 md:hidden">
                                                {badge.name}
                                            </span> */}
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="text-center max-w-[200px]">
                                        <div className="font-bold flex items-center gap-1.5 justify-center mb-0.5">
                                            {badge.name}
                                            {isEarned && <span className="text-[10px] bg-primary text-primary-foreground px-1.5 rounded-sm">Earned</span>}
                                        </div>
                                        <div className="text-xs text-muted-foreground">{badge.description}</div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
};
