import { v } from "convex/values";
import { query } from "./_generated/server";
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
                if (!user) return null;

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

        // Filter out nulls (deleted users)
        return topUsers.filter((u) => u !== null);
    },
});
