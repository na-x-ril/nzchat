import { mutation, query } from "./_generated/server"
import { v } from "convex/values"

export const createRoom = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const roomId = await ctx.db.insert("rooms", {
      ...args,
      isActive: true,
      createdAt: Date.now(),
    })

    // Add owner as member with owner role
    await ctx.db.insert("roomMembers", {
      roomId,
      userId: args.ownerId,
      role: "owner",
      joinedAt: Date.now(),
      isBlocked: false,
    })

    return roomId
  },
})

export const getAllRooms = query({
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect()

    const roomsWithDetails = await Promise.all(
      rooms.map(async (room) => {
        const owner = await ctx.db.get(room.ownerId)
        const memberCount = await ctx.db
          .query("roomMembers")
          .withIndex("by_room", (q) => q.eq("roomId", room._id))
          .filter((q) => q.neq(q.field("isBlocked"), true))
          .collect()

        return {
          ...room,
          ownerUsername: owner?.username || "Unknown",
          memberCount: memberCount.length,
        }
      }),
    )

    return roomsWithDetails.sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const getRoom = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const room = await ctx.db.get(args.roomId)
    if (!room) return null

    const owner = await ctx.db.get(room.ownerId)
    const memberCount = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .filter((q) => q.neq(q.field("isBlocked"), true))
      .collect()

    return {
      ...room,
      ownerUsername: owner?.username || "Unknown",
      memberCount: memberCount.length,
    }
  },
})

export const joinRoom = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is already a member
    const existingMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
      .first()

    if (existingMember) {
      if (existingMember.isBlocked) {
        throw new Error("You are blocked from this room")
      }
      throw new Error("User is already a member of this room")
    }

    // Check if user was kicked recently (within 24 hours)
    const recentKick = await ctx.db
      .query("kickedUsers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
      .order("desc")
      .first()

    if (recentKick && Date.now() - recentKick.kickedAt < 24 * 60 * 60 * 1000) {
      throw new Error("You were recently kicked from this room. Please wait 24 hours before rejoining.")
    }

    return await ctx.db.insert("roomMembers", {
      roomId: args.roomId,
      userId: args.userId,
      role: "member",
      joinedAt: Date.now(),
      isBlocked: false,
    })
  },
})

export const getUserRole = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check if user is CEO
    const user = await ctx.db.get(args.userId)
    if (user?.username === "onlynazril7z") {
      return "owner" // CEO has owner privileges everywhere
    }

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
      .first()

    if (!membership) return "visitor"
    if (membership.isBlocked) return "blocked"

    return membership.role
  },
})

export const promoteToAdmin = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    promotedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const promoter = await ctx.db.get(args.promotedBy)
    const promoterRole = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.promotedBy))
      .first()

    const isCEO = promoter?.username === "onlynazril7z"
    const canPromote = isCEO || promoterRole?.role === "owner" || promoterRole?.role === "admin"

    if (!canPromote) {
      throw new Error("Only owners and admins can promote members")
    }

    // Get target member
    const targetMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .first()

    if (!targetMember) {
      throw new Error("User is not a member of this room")
    }

    if (targetMember.role === "admin") {
      throw new Error("User is already an admin")
    }

    if (targetMember.role === "owner") {
      throw new Error("Cannot promote owner")
    }

    // Promote to admin
    await ctx.db.patch(targetMember._id, {
      role: "admin",
    })

    // Log the action
    await ctx.db.insert("auditLogs", {
      roomId: args.roomId,
      actionBy: args.promotedBy,
      actionType: "promote_admin",
      targetUserId: args.targetUserId,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

export const kickUser = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    kickedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const kicker = await ctx.db.get(args.kickedBy)
    const kickerRole = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.kickedBy))
      .first()

    const isCEO = kicker?.username === "onlynazril7z"
    const canKick = isCEO || kickerRole?.role === "owner" || kickerRole?.role === "admin"

    if (!canKick) {
      throw new Error("Only owners and admins can kick members")
    }

    // Get target member
    const targetMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .first()

    if (!targetMember) {
      throw new Error("User is not a member of this room")
    }

    // Cannot kick owner unless you're CEO
    if (targetMember.role === "owner" && !isCEO) {
      throw new Error("Cannot kick room owner")
    }

    // Cannot kick CEO
    const targetUser = await ctx.db.get(args.targetUserId)
    if (targetUser?.username === "onlynazril7z") {
      throw new Error("Cannot kick CEO")
    }

    // Remove from room
    await ctx.db.delete(targetMember._id)

    // Log the kick
    await ctx.db.insert("kickedUsers", {
      roomId: args.roomId,
      userId: args.targetUserId,
      kickedBy: args.kickedBy,
      kickedAt: Date.now(),
      reason: args.reason,
    })

    // Log the action
    await ctx.db.insert("auditLogs", {
      roomId: args.roomId,
      actionBy: args.kickedBy,
      actionType: "kick_user",
      targetUserId: args.targetUserId,
      reason: args.reason,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

export const blockUser = mutation({
  args: {
    roomId: v.id("rooms"),
    targetUserId: v.id("users"),
    blockedBy: v.id("users"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check permissions
    const blocker = await ctx.db.get(args.blockedBy)
    const blockerRole = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.blockedBy))
      .first()

    const isCEO = blocker?.username === "onlynazril7z"
    const canBlock = isCEO || blockerRole?.role === "owner"

    if (!canBlock) {
      throw new Error("Only owners can block users")
    }

    // Get target member
    const targetMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.targetUserId))
      .first()

    if (!targetMember) {
      throw new Error("User is not a member of this room")
    }

    // Cannot block owner unless you're CEO
    if (targetMember.role === "owner" && !isCEO) {
      throw new Error("Cannot block room owner")
    }

    // Cannot block CEO
    const targetUser = await ctx.db.get(args.targetUserId)
    if (targetUser?.username === "onlynazril7z") {
      throw new Error("Cannot block CEO")
    }

    // Block user
    await ctx.db.patch(targetMember._id, {
      isBlocked: true,
      blockedBy: args.blockedBy,
      blockedAt: Date.now(),
      blockReason: args.reason,
    })

    // Log the action
    await ctx.db.insert("auditLogs", {
      roomId: args.roomId,
      actionBy: args.blockedBy,
      actionType: "block_user",
      targetUserId: args.targetUserId,
      reason: args.reason,
      createdAt: Date.now(),
    })

    return { success: true }
  },
})

export const getRoomMembers = query({
  args: { roomId: v.id("rooms") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("roomMembers")
      .withIndex("by_room", (q) => q.eq("roomId", args.roomId))
      .collect()

    const membersWithDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.userId)
        return {
          ...member,
          username: user?.username || "Unknown",
          name: user?.name || "Unknown",
          imageUrl: user?.imageUrl || "",
        }
      }),
    )

    // Fix the roleOrder typing issue
    const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 }
    return membersWithDetails.sort((a, b) => {
      const aOrder = roleOrder[a.role] ?? 3
      const bOrder = roleOrder[b.role] ?? 3
      return aOrder - bOrder
    })
  },
})
