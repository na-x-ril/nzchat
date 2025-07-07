import { checkCEO } from "@/packages/shared/admin";
import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

function sanitizeUsername(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "") // Remove non-alphanumeric characters
      .slice(0, 20) // Limit length to 20 characters
  );
}

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    name: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Prioritize name (e.g., Google name from Clerk) for username
    let desiredUsername = args.name && args.name.trim().length > 0 ? args.name : args.username;

    // Fallback if no valid name or username
    if (!desiredUsername || desiredUsername.trim().length === 0) {
      desiredUsername = `user-${Date.now()}`;
    }

    // Sanitize and ensure username uniqueness
    let finalUsername = sanitizeUsername(desiredUsername);
    let suffix = 1;
    let uniqueUsername = finalUsername;
    while (await ctx.db.query("users").withIndex("by_username", (q) => q.eq("username", uniqueUsername)).first()) {
      uniqueUsername = `${finalUsername}-${suffix}`;
      suffix++;
    }

    const existingClerkUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existingClerkUser) {
      return { success: true, userId: existingClerkUser._id };
    }

    const inserted = await ctx.db.insert("users", {
      ...args,
      username: uniqueUsername, // Use the unique username
      isBanned: false,
      showSpeedDialog: true,
      createdAt: Date.now(),
    });

    return { success: true, userId: inserted };
  },
});

export const updateConnectionSpeed = mutation({
  args: {
    userId: v.id("users"),
    connectionSpeed: v.optional(v.number()),
    showSpeedDialog: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      connectionSpeed: args.connectionSpeed,
      showSpeedDialog: args.showSpeedDialog,
    })
    return { success: true }
  },
})

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (!user) return null

    return {
      ...user,
      banned: user.isBanned ?? false,
    }
  },
})

export const isUserBanned = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    return user?.isBanned ?? false;
  },
});

export const getUserByClerkId = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const banUser = mutation({
  args: {
    targetUserId: v.id("users"),
    bannedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Only CEO can ban users
    const banningUser = await ctx.db.get(args.bannedBy)
    if (!checkCEO(banningUser?.email)) {
      throw new Error("Only CEO can ban users")
    }

    const targetUser = await ctx.db.get(args.targetUserId)
    if (!targetUser) {
      throw new Error("User not found")
    }

    // Cannot ban CEO
    if (checkCEO(targetUser?.email)) {
      throw new Error("Cannot ban CEO")
    }

    await ctx.db.patch(args.targetUserId, {
      isBanned: true,
      bannedBy: args.bannedBy,
      bannedAt: Date.now(),
      banReason: args.reason,
    })

    // Log the action
    await ctx.db.insert("auditLogs", {
      actionBy: args.bannedBy,
      actionType: "ban_user",
      targetUserId: args.targetUserId,
      reason: args.reason,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

export const unbanUser = mutation({
  args: {
    targetUserId: v.id("users"),
    unbannedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Only CEO can unban users
    const unbanningUser = await ctx.db.get(args.unbannedBy)
    if (!checkCEO(unbanningUser?.email)) {
      throw new Error("Only CEO can unban users")
    }

    await ctx.db.patch(args.targetUserId, {
      isBanned: false,
      bannedBy: undefined,
      bannedAt: undefined,
      banReason: undefined,
    })

    // Log the action
    await ctx.db.insert("auditLogs", {
      actionBy: args.unbannedBy,
      actionType: "unban_user",
      targetUserId: args.targetUserId,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

export const getAllUsers = query({
  args: { requesterId: v.id("users") },
  handler: async (ctx, args) => {
    // Only CEO can see all users
    const requester = await ctx.db.get(args.requesterId)
    if (!checkCEO(requester?.email)) {
      throw new Error("Only CEO can view all users")
    }

    return await ctx.db.query("users").collect()
  },
})
