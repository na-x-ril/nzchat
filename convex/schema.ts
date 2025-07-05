import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

const schema = defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    username: v.string(),
    name: v.string(),
    imageUrl: v.string(),
    isBanned: v.optional(v.boolean()),
    bannedBy: v.optional(v.id("users")),
    bannedAt: v.optional(v.number()),
    banReason: v.optional(v.string()),
    // Connection speed settings
    connectionSpeed: v.optional(v.number()), // in Mbps
    showSpeedDialog: v.optional(v.boolean()), // whether to show speed dialog
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_username", ["username"])
    .index("by_banned", ["isBanned"]),

  rooms: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    ownerId: v.id("users"),
    isActive: v.boolean(),
    createdAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_active", ["isActive"]),

  roomMembers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    role: v.union(v.literal("member"), v.literal("admin"), v.literal("owner")),
    joinedAt: v.number(),
    isBlocked: v.optional(v.boolean()),
    blockedBy: v.optional(v.id("users")),
    blockedAt: v.optional(v.number()),
    blockReason: v.optional(v.string()),
  })
    .index("by_room", ["roomId"])
    .index("by_user", ["userId"])
    .index("by_room_user", ["roomId", "userId"])
    .index("by_room_blocked", ["roomId", "isBlocked"]),

  messages: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
    replyTo: v.optional(
      v.object({
        messageId: v.id("messages"),
        content: v.string(),
        username: v.string(),
      }),
    ),
    // File attachment support
    fileAttachment: v.optional(
      v.object({
        fileId: v.id("_storage"),
        fileName: v.string(),
        fileType: v.string(),
        fileSize: v.number(),
        thumbnailId: v.optional(v.id("_storage")), // for image/video thumbnails
      }),
    ),
    isDeleted: v.optional(v.boolean()),
    deletedBy: v.optional(v.id("users")),
    deletedAt: v.optional(v.number()),
    deletedFor: v.optional(v.union(v.literal("me"), v.literal("everyone"))),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_room_created", ["roomId", "createdAt"]),

  deletedMessages: defineTable({
    messageId: v.id("messages"),
    userId: v.id("users"),
    deletedAt: v.number(),
  })
    .index("by_message_user", ["messageId", "userId"])
    .index("by_user", ["userId"]),

  mutedUsers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    mutedBy: v.id("users"),
    mutedAt: v.number(),
    expiresAt: v.optional(v.number()),
  })
    .index("by_room_user", ["roomId", "userId"])
    .index("by_room", ["roomId"]),

  kickedUsers: defineTable({
    roomId: v.id("rooms"),
    userId: v.id("users"),
    kickedBy: v.id("users"),
    kickedAt: v.number(),
    reason: v.optional(v.string()),
  })
    .index("by_room_user", ["roomId", "userId"])
    .index("by_room", ["roomId"]),

  auditLogs: defineTable({
    roomId: v.optional(v.id("rooms")),
    actionBy: v.id("users"),
    actionType: v.union(
      v.literal("promote_admin"),
      v.literal("demote_admin"),
      v.literal("kick_user"),
      v.literal("block_user"),
      v.literal("unblock_user"),
      v.literal("ban_user"),
      v.literal("unban_user"),
      v.literal("mute_user"),
      v.literal("unmute_user"),
      v.literal("delete_message"),
      v.literal("file_upload"),
    ),
    targetUserId: v.id("users"),
    reason: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_room", ["roomId"])
    .index("by_action_by", ["actionBy"])
    .index("by_target", ["targetUserId"])
    .index("by_created", ["createdAt"])
    .index("by_action_type", ["actionType"]),
})

export default schema
