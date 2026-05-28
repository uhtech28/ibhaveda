import { v } from "convex/values";
import { query, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getTopUsers = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 5;

        // Get top wallets by balance
        const topWallets = await ctx.db
            .query("wallets")
            .withIndex("by_balance", (q) => q)
            .order("desc")
            .take(limit);

        // Get user details for each wallet
        const topUsers = await Promise.all(
            topWallets.map(async (wallet) => {
                const user = await ctx.db.get(wallet.userId);
                if (!user || user.role === "agent") return null;

                return {
                    _id: user._id,
                    displayName: user.displayName,
                    username: user.username,
                    avatar: user.avatar,
                    points: wallet.balance,
                    level: user.level || 1,
                };
            })
        );

        // Filter out nulls (deleted users) and agent accounts
        return topUsers.filter((u) => u !== null);
    },
});

// Weekly Leaderboard Query
export const getWeeklyLeaderboard = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit ?? 3;

        // 1. Calculate start of the week (7 days ago)
        const startOfWeekTimestamp = Date.now() - 7 * 24 * 60 * 60 * 1000;

        // 2. Fetch all transactions since start of week using the index (efficient!)
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_created_at", (q) => q.gte("createdAt", startOfWeekTimestamp))
            .collect();

        if (transactions.length === 0) return [];

        // 3. Aggregate points per walletId
        const walletPoints = new Map<string, number>();
        for (const tx of transactions) {
            if (tx.amount > 0) {
                const current = walletPoints.get(tx.walletId) || 0;
                walletPoints.set(tx.walletId, current + tx.amount);
            }
        }

        // 4. Sort and take top N
        const sortedEntries = Array.from(walletPoints.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        // 5. Fetch User Details for each matched wallet
        const results = await Promise.all(
            sortedEntries.map(async ([walletId, points], index) => {
                const wallet = await ctx.db.get(walletId as Id<"wallets">);
                if (!wallet) return null;

                const user = await ctx.db.get(wallet.userId);
                if (!user || user.role === "agent") return null;

                return {
                    _id: user._id,
                    displayName: user.displayName,
                    username: user.username,
                    avatar: user.avatar ?? null,
                    points,
                    level: user.level ?? 1,
                    rank: index + 1,
                };
            })
        );

        return results.filter((u): u is NonNullable<typeof u> => u !== null);
    }
});

// Daily Leaderboard Query
export const getDailyLeaderboard = query({
    args: {
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const limit = args.limit || 5;

        // 1. Calculate start of "today" in IST
        // IST is UTC+5:30
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTime = new Date(utcTime + (330 * 60000));

        istTime.setHours(0, 0, 0, 0); // Midnight IST
        // Convert back to UTC timestamp for database query
        // We need to look for transactions created AFTER this timestamp
        // Start of IST day in UTC = istTime - 5.5 hours
        const startOfDayTimestamp = istTime.getTime() - (330 * 60000);

        // 2. Fetch all transactions since start of day
        // Note: For High Scale, we'd need a more optimized approach (e.g. DailyStats table)
        // But for <10k daily transactions, this aggregation is fine.
        const transactions = await ctx.db
            .query("transactions")
            .withIndex("by_type", (q) => q) // Scan all transactions? Better to scan by time if possible
            // Optimized: We should probably add an index on createdAt or filter in memory if volume low
            .filter((q) => q.gte(q.field("createdAt"), startOfDayTimestamp))
            .collect();

        // 3. Aggregate points per user
        const userPoints = new Map<string, number>();

        for (const tx of transactions) {
            // We need to get the user ID from the wallet ID
            // This requires mapping wallet -> user.
            // Efficient way: Fetch all wallets once or cache?
            // For MVP: Let's fetch wallet for each tx? No, too slow.
            // Better: Fetch all wallets involved.
            if (tx.amount > 0) { // Only count positive points for "Score"
                // Wait, we need the userId.
                // Let's store userPoints by WalletId first
                const current = userPoints.get(tx.walletId) || 0;
                userPoints.set(tx.walletId, current + tx.amount);
            }
        }

        // 4. Sort and take top N
        const sortedWallets = Array.from(userPoints.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit);

        // 5. Fetch User Details
        const results = await Promise.all(
            sortedWallets.map(async ([walletId, points]) => {
                const wallet = await ctx.db.get(walletId as Id<"wallets">);
                if (!wallet) return null;

                const user = await ctx.db.get(wallet.userId);
                if (!user || user.role === "agent") return null;

                return {
                    _id: user._id,
                    displayName: user.displayName,
                    username: user.username,
                    avatar: user.avatar,
                    points: points, // Daily Score
                    level: user.level || 1,
                    rank: 0 // to be filled
                };
            })
        );

        return results.filter(u => u !== null).map((u, index) => ({ ...u, rank: index + 1 }));
    }
});

export const finalizeDailyLeaderboard = internalMutation({
    args: {},
    handler: async (ctx) => {
        // 1. Get Top 3 Daily Users
        // Re-implement lightweight logic or call the query logic?
        // Mutations can't call queries directly in the same context easily without overhead.
        // Let's copy the aggregation logic for the Cron Job to be safe and atomic.

        // IST Calculation
        const now = new Date();
        const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istTime = new Date(utcTime + (330 * 60000));

        // This runs at midnight IST, so we want the *previous* day's data?
        // Or does it run at 23:59?
        // Let's assume it runs at 00:00 IST for the day that just ended.
        // So we want the 24h period ending Now.

        const startOfPreviousDayIST = istTime.getTime() - (24 * 60 * 60 * 1000);
        // We want transactions from [Now - 24h] to [Now]

        const transactions = await ctx.db
            .query("transactions")
            .filter((q) => q.gte(q.field("createdAt"), startOfPreviousDayIST))
            .collect();

        const userPoints = new Map<string, number>();
        for (const tx of transactions) {
            if (tx.amount > 0) {
                const current = userPoints.get(tx.walletId) || 0;
                userPoints.set(tx.walletId, current + tx.amount);
            }
        }

        const top3Wallets = Array.from(userPoints.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        const dateStr = istTime.toISOString().split('T')[0]; // Store as YYYY-MM-DD

        for (let i = 0; i < top3Wallets.length; i++) {
            const [walletId, points] = top3Wallets[i];
            const wallet = await ctx.db.get(walletId as Id<"wallets">);
            if (wallet) {
                const walletUser = await ctx.db.get(wallet.userId);
                if (walletUser?.role === "agent") continue;
                await ctx.db.insert("dailyLeaderboardWinners", {
                    date: dateStr,
                    userId: wallet.userId,
                    rank: i + 1,
                    points: points,
                    awardedAt: Date.now(),
                });

                // Optional: Award a permanent badge via the Badge System?
                // The PRD says "Medal on profile", which is effectively the dailyLeaderboardWinners record.
            }
        }
    }
});

export const getDailyWins = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const wins = await ctx.db
            .query("dailyLeaderboardWinners")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();

        return wins.map(w => ({
            date: w.date,
            rank: w.rank,
            points: w.points
        }));
    }
});
