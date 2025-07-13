import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { checkCEO } from "@/packages/shared/admin"

export const sendMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    content: v.string(),
    useMarkdown: v.optional(v.boolean()), // New argument
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    const isCEO = checkCEO(user?.email)

    if (!isCEO) {
      const membership = await ctx.db
        .query("roomMembers")
        .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
        .first()

      if (!membership || membership.isBlocked) {
        throw new Error("You must be a member to send messages")
      }
    }

    const muted = await ctx.db
      .query("mutedUsers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
      .first()

    if (muted && (!muted.expiresAt || muted.expiresAt > Date.now())) {
      throw new Error("You are muted in this room")
    }

    let replyTo: { messageId: Id<"messages">; content: string; username: string } | undefined = undefined
    if (args.replyToId) {
      const replyMessage = await ctx.db.get(args.replyToId)
      if (replyMessage) {
        const replyUser = await ctx.db.get(replyMessage.userId)
        replyTo = {
          messageId: replyMessage._id,
          content: replyMessage.content,
          username: replyUser?.username || "Unknown",
        }
      }
    }

    return await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      content: args.content,
      useMarkdown: args.useMarkdown, // Store useMarkdown
      replyTo: replyTo || undefined,
      createdAt: Date.now(),
    })
  },
})

export const sendFileMessage = mutation({
  args: {
    roomId: v.id("rooms"),
    userId: v.id("users"),
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    content: v.string(),
    useMarkdown: v.optional(v.boolean()), // New argument
    replyToId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId)
    const isCEO = checkCEO(user?.email)

    if (!isCEO) {
      const membership = await ctx.db
        .query("roomMembers")
        .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
        .first()

      if (!membership || membership.isBlocked) {
        throw new Error("You must be a member to send messages")
      }
    }

    const muted = await ctx.db
      .query("mutedUsers")
      .withIndex("by_room_user", (q) => q.eq("roomId", args.roomId).eq("userId", args.userId))
      .first()

    if (muted && (!muted.expiresAt || muted.expiresAt > Date.now())) {
      throw new Error("You are muted in this room")
    }

    let replyTo: { messageId: Id<"messages">; content: string; username: string } | undefined = undefined
    if (args.replyToId) {
      const replyMessage = await ctx.db.get(args.replyToId)
      if (replyMessage) {
        const replyUser = await ctx.db.get(replyMessage.userId)
        replyTo = {
          messageId: replyMessage._id,
          content: replyMessage.content,
          username: replyUser?.username || "Unknown",
        }
      }
    }

    return await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      content: args.content,
      useMarkdown: args.useMarkdown, // Store useMarkdown
      fileAttachment: {
        fileId: args.fileId,
        fileName: args.fileName,
        fileType: args.fileType,
        fileSize: args.fileSize,
      },
      replyTo: replyTo || undefined,
      createdAt: Date.now(),
    })
  },
})

export const deleteMessage = mutation({
  args: {
    messageId: v.id("messages"),
    deletedBy: v.id("users"),
    deleteType: v.union(v.literal("for_me"), v.literal("for_everyone")),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId)
    if (!message) {
      throw new Error("Message not found")
    }

    const user = await ctx.db.get(args.deletedBy)
    const isCEO = checkCEO(user?.email)
    const isMessageOwner = message.userId === args.deletedBy

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_user", (q) => q.eq("roomId", message.roomId).eq("userId", args.deletedBy))
      .first()

    const canDeleteForEveryone = isCEO || membership?.role === "owner" || membership?.role === "admin" || isMessageOwner

    if (args.deleteType === "for_everyone" && !canDeleteForEveryone) {
      throw new Error("You don't have permission to delete this message for everyone")
    }

    if (args.deleteType === "for_everyone") {
      await ctx.db.patch(args.messageId, {
        isDeleted: true,
        deletedBy: args.deletedBy,
        deletedAt: Date.now(),
        deletedFor: "everyone",
      })
    } else {
      const existingDeletion = await ctx.db
        .query("deletedMessages")
        .withIndex("by_message_user", (q) => q.eq("messageId", args.messageId).eq("userId", args.deletedBy))
        .first()

      if (!existingDeletion) {
        await ctx.db.insert("deletedMessages", {
          messageId: args.messageId,
          userId: args.deletedBy,
          deletedAt: Date.now(),
        })
      }
    }

    return { success: true }
  },
})

export const getMessages = query({
  args: {
    roomId: v.id("rooms"),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_room_created", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(100)

    let userDeletedMessages: string[] = []
    if (args.userId) {
      const deletedForUser = await ctx.db
        .query("deletedMessages")
        .withIndex("by_user", (q) => q.eq("userId", args.userId!))
        .collect()
      userDeletedMessages = deletedForUser.map((d) => d.messageId)
    }

    const messagesWithUsers = await Promise.all(
      messages.map(async (message) => {
        const user = await ctx.db.get(message.userId)

        const isDeletedForMe = args.userId ? userDeletedMessages.includes(message._id) : false
        const isDeletedForEveryone = message.isDeleted || false

        let deletedFor: "me" | "everyone" | undefined = undefined
        if (isDeletedForEveryone) {
          deletedFor = "everyone"
        } else if (isDeletedForMe) {
          deletedFor = "me"
        }

        return {
          ...message,
          username: user?.username || "Unknown",
          userImageUrl: user?.imageUrl || "",
          isDeleted: isDeletedForMe || isDeletedForEveryone,
          deletedFor,
          useMarkdown: message.useMarkdown, // Include useMarkdown
        }
      }),
    )

    return messagesWithUsers.reverse()
  },
})