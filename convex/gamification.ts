import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Helper to get consistent date string (UTC)
function getTodayString(): string {
    return new Date().toISOString().split('T')[0];
}

// Get user's current streak
export const getStreak = query({
    handler: async ({ db, auth }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const streak = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return streak || {
            currentStreak: 0,
            longestStreak: 0,
            lastLoginDate: "",
            recoveryAvailable: false
        };
    },
});

// Update streak logic - usually called on session start
export const updateStreak = mutation({
    handler: async ({ db, auth, scheduler }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const today = getTodayString();

        // Get existing streak record
        const streakRecord = await db
            .query("userStreaks")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        if (!streakRecord) {
            // First time streak creation
            await db.insert("userStreaks", {
                userId: user._id,
                currentStreak: 1,
                longestStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
                recoveryAvailable: true,
            });

            // Gamification: Daily Login Reward (First time)
            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "started", streak: 1 };
        }

        // Already logged in today?
        if (streakRecord.lastLoginDate === today) {
            return { status: "maintained", streak: streakRecord.currentStreak };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayString = yesterday.toISOString().split('T')[0];

        if (streakRecord.lastLoginDate === yesterdayString) {
            // Logged in yesterday -> Increment streak
            const newStreak = streakRecord.currentStreak + 1;
            await db.patch(streakRecord._id, {
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, streakRecord.longestStreak),
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });

            // Gamification: Daily Login Reward (Streak Continue)
            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "incremented", streak: newStreak };
        } else {
            // Missed a day (or more) -> Reset streak
            // Check if recovery is available? (Future feature: Streak Freeze)
            await db.patch(streakRecord._id, {
                currentStreak: 1,
                lastLoginDate: today,
                lastStreakUpdate: Date.now(),
            });

            // Gamification: Daily Login Reward (Streak Reset)
            await scheduler.runAfter(0, internal.gamification.internalAwardXP, {
                userId: user._id,
                amount: 10,
                action: "daily_login",
            });
            await scheduler.runAfter(0, internal.gamification.internalAwardPoints, {
                userId: user._id,
                amount: 10,
                type: "daily_login",
                description: "Daily Login Bonus"
            });

            return { status: "reset", streak: 1 };
        }
    },
});

// Gamification: Wallet & Points System

// Get user's wallet balance
export const getWallet = query({
    handler: async ({ db, auth }) => {
        const identity = await auth.getUserIdentity();
        if (!identity) return null;

        const user = await db
            .query("users")
            .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
            .first();

        if (!user) return null;

        const wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", user._id))
            .first();

        return wallet || { balance: 0 };
    },
});

// Award points to a user (Internal or admin use primarily)
// Usage: await awardPoints({ db, userId: ..., amount: 10, type: 'daily_login', description: 'Daily Login Reward' })
export const awardPoints = mutation({
    args: {
        userId: v.optional(v.id("users")), // Optional if calling as user
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        relatedId: v.optional(v.string()),
    },
    handler: async ({ db, auth }, args) => {
        let userId = args.userId;

        // If no userId provided, try to get from auth
        if (!userId) {
            const identity = await auth.getUserIdentity();
            if (!identity) throw new Error("Unauthorized");
            const user = await db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!user) throw new Error("User not found");
            userId = user._id;
        }

        // Get or create wallet
        let wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", userId!))
            .first();

        if (!wallet) {
            const walletId = await db.insert("wallets", {
                userId: userId!,
                balance: 0,
                updatedAt: Date.now(),
            });
            wallet = await db.get(walletId);
        }

        if (!wallet) throw new Error("Failed to initialize wallet");

        // Calculate new balance
        const newBalance = wallet.balance + args.amount;

        // Update wallet
        await db.patch(wallet._id, {
            balance: newBalance,
            updatedAt: Date.now(),
        });

        // Record transaction
        await db.insert("transactions", {
            walletId: wallet._id,
            amount: args.amount,
            type: args.type,
            description: args.description,
            relatedId: args.relatedId,
            createdAt: Date.now(),
        });

        return { success: true, newBalance };
    },
});

// Award XP to a user and handle level ups
// Usage: await awardXP({ db, userId: ..., amount: 50, action: 'create_idea' })
export const awardXP = mutation({
    args: {
        userId: v.optional(v.id("users")),
        amount: v.number(),
        action: v.string(), // For logging/history if we add it later
    },
    handler: async ({ db, auth }, args) => {
        let userId = args.userId;

        // If no userId provided, try to get from auth
        if (!userId) {
            const identity = await auth.getUserIdentity();
            if (!identity) throw new Error("Unauthorized");
            const user = await db
                .query("users")
                .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
                .first();
            if (!user) throw new Error("User not found");
            userId = user._id;
        }

        const user = await db.get(userId);
        if (!user) throw new Error("User not found");

        const currentXP = user.xp || 0;
        const currentLevel = user.level || 1;
        const newXP = currentXP + args.amount;

        // Level calculation: Level = floor(sqrt(XP / 100)) + 1
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

        await db.patch(userId, {
            xp: newXP,
            level: newLevel,
        });

        return {
            xpAdded: args.amount,
            newTotalXP: newXP,
            levelUp: newLevel > currentLevel,
            newLevel,
        };
    },
});

// Internal mutation to award XP (for use by other mutations via scheduler)
export const internalAwardXP = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        action: v.string(),
    },
    handler: async ({ db }, args) => {
        const user = await db.get(args.userId);
        if (!user) return; // Fail silently for background tasks

        const currentXP = user.xp || 0;
        const newXP = currentXP + args.amount;

        // Level calculation: Level = floor(sqrt(XP / 100)) + 1
        const newLevel = Math.floor(Math.sqrt(newXP / 100)) + 1;

        await db.patch(args.userId, {
            xp: newXP,
            level: newLevel,
        });
    },
});

// Internal mutation to award Points (for use by other mutations via scheduler)
export const internalAwardPoints = internalMutation({
    args: {
        userId: v.id("users"),
        amount: v.number(),
        type: v.string(),
        description: v.string(),
        relatedId: v.optional(v.string()),
    },
    handler: async ({ db }, args) => {
        // Get or create wallet
        let wallet = await db
            .query("wallets")
            .withIndex("by_user", (q) => q.eq("userId", args.userId))
            .first();

        if (!wallet) {
            const walletId = await db.insert("wallets", {
                userId: args.userId,
                balance: 0,
                updatedAt: Date.now(),
            });
            wallet = await db.get(walletId);
        }

        if (!wallet) return;

        // Calculate new balance
        const newBalance = wallet.balance + args.amount;

        // Update wallet
        await db.patch(wallet._id, {
            balance: newBalance,
            updatedAt: Date.now(),
        });

        // Record transaction
        await db.insert("transactions", {
            walletId: wallet._id,
            amount: args.amount,
            type: args.type,
            description: args.description,
            relatedId: args.relatedId,
            createdAt: Date.now(),
        });
    },
});

// Update streak logic - usually called on session start


