import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const createUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    name: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first()

    if (existingUser) {
      throw new Error("Username already taken")
    }

    // Check if user already exists with this Clerk ID
    const existingClerkUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first()

    if (existingClerkUser) {
      throw new Error("User already exists")
    }

    return await ctx.db.insert("users", {
      ...args,
      isBanned: false,
      showSpeedDialog: true, // Show speed dialog by default for new users
      createdAt: Date.now(),
    })
  },
})

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

    // Check if user is banned
    if (user?.isBanned) {
      throw new Error("Your account has been banned from this application")
    }

    return user
  },
})

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId)
  },
})

export const banUser = mutation({
  args: {
    targetUserId: v.id("users"),
    bannedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Only CEO can ban users
    const banningUser = await ctx.db.get(args.bannedBy)
    if (banningUser?.username !== "onlynazril7z") {
      throw new Error("Only CEO can ban users")
    }

    const targetUser = await ctx.db.get(args.targetUserId)
    if (!targetUser) {
      throw new Error("User not found")
    }

    // Cannot ban CEO
    if (targetUser.username === "onlynazril7z") {
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
    if (unbanningUser?.username !== "onlynazril7z") {
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
    if (requester?.username !== "onlynazril7z") {
      throw new Error("Only CEO can view all users")
    }

    return await ctx.db.query("users").collect()
  },
})
