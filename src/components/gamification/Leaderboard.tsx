import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Crown, Calendar, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Id } from "../../../convex/_generated/dataModel";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface LeaderboardUser {
  _id: Id<"users">;
  displayName: string;
  username: string;
  avatar?: string;
  points: number;
  level: number;
}

export const Leaderboard = () => {
  const [view, setView] = useState<"daily" | "all-time">("daily");

  const topUsersAllTime = useQuery(api.leaderboard.getTopUsers, { limit: 5 });
  const topUsersDaily = useQuery(api.leaderboard.getDailyLeaderboard, { limit: 5 });

  const topUsers = view === "daily" ? topUsersDaily : topUsersAllTime;
  const isLoading = view === "daily" ? topUsersDaily === undefined : topUsersAllTime === undefined;

  // if (!topUsers) return null; // Don't return null, show loading skeleton or empty state

  return (
    <Card className="w-full mb-8 border-border/50 bg-gradient-to-b from-background to-muted/20">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Crown className="w-5 h-5 text-yellow-500" />
          {view === "daily" ? "Daily Champions" : "Community Leaders"}
        </CardTitle>

        <div className="flex bg-muted/50 p-1 rounded-lg">
          <Button
            variant={view === "daily" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setView("daily")}
          >
            Today
          </Button>
          <Button
            variant={view === "all-time" ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs px-3"
            onClick={() => setView("all-time")}
          >
            All Time
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Loading leaderboard...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {topUsers?.map((user: LeaderboardUser, index: number) => (
              <Link
                href={`/profile/${user.username}`}
                key={user._id}
                className="group relative flex flex-col items-center p-4 rounded-xl border border-border/40 bg-card hover:border-primary/50 hover:shadow-md transition-all duration-300"
              >
                {/* Rank Badge */}
                <div className={cn(
                  "absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shadow-sm border",
                  index === 0 ? "bg-yellow-400 text-yellow-900 border-yellow-500" :
                    index === 1 ? "bg-slate-300 text-slate-900 border-slate-400" :
                      index === 2 ? "bg-amber-600 text-amber-100 border-amber-700" :
                        "bg-muted text-muted-foreground border-border"
                )}>
                  #{index + 1}
                </div>

                <Avatar className="w-16 h-16 mb-3 border-2 border-background shadow-sm ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all">
                  <AvatarImage src={user.avatar} alt={user.displayName} />
                  <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="text-center w-full">
                  <h3 className="font-semibold text-sm truncate w-full px-2 group-hover:text-primary transition-colors">
                    {user.displayName}
                  </h3>
                  <div className="flex items-center justify-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <span className="font-mono font-medium text-foreground">{user.points}</span>
                    <span>Points</span>
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5">
                    Lvl {user.level}
                  </div>
                </div>
              </Link>
            ))}

            {topUsers && topUsers.length === 0 && (
              <div className="col-span-5 text-center py-12 bg-muted/10 rounded-xl border border-dashed">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-muted rounded-full">
                    {view === "daily" ? <Calendar className="w-6 h-6 text-muted-foreground" /> : <Globe className="w-6 h-6 text-muted-foreground" />}
                  </div>
                  <p className="text-muted-foreground font-medium">
                    {view === "daily"
                      ? "No points scored today yet. Be the first!"
                      : "No leaders yet. Start earning points!"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card >
  );
};
