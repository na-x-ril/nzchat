import { mutation, query } from "./_generated/server"
import { v } from "convex/values"
import type { Id } from "./_generated/dataModel"
import { checkCEO } from "@/packages/shared/admin"

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.storage.generateUploadUrl()
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
    content: v.optional(v.string()),
    useMarkdown: v.optional(v.boolean()), // Added useMarkdown argument
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

    let messageContent: string = ""
    if (args.content && args.content.trim()) {
      messageContent = args.content.trim()
    }

    const messageId = await ctx.db.insert("messages", {
      roomId: args.roomId,
      userId: args.userId,
      content: messageContent,
      useMarkdown: args.useMarkdown, // Store useMarkdown
      fileAttachment: {
        fileId: args.fileId,
        fileName: args.fileName,
        fileType: args.fileType,
        fileSize: args.fileSize,
      },
      replyTo,
      createdAt: Date.now(),
    })

    const fileUrl = await ctx.storage.getUrl(args.fileId)

    console.log(`File uploaded and shared:`, {
      messageId: messageId,
      userId: args.userId,
      username: user?.username || "Unknown",
      roomId: args.roomId,
      fileName: args.fileName,
      fileType: args.fileType,
      fileSize: args.fileSize,
      fileUrl: fileUrl,
      hasCaption: !!args.content?.trim(),
      useMarkdown: args.useMarkdown, // Log useMarkdown
      timestamp: new Date().toISOString(),
    })

    await ctx.db.insert("auditLogs", {
      roomId: args.roomId,
      actionBy: args.userId,
      actionType: "file_upload",
      targetUserId: args.userId,
      metadata: {
        messageId: messageId,
        fileName: args.fileName,
        fileType: args.fileType,
        fileSize: args.fileSize,
        fileUrl: fileUrl,
        hasCaption: !!args.content?.trim(),
        useMarkdown: args.useMarkdown, // Include in audit log metadata
      },
      createdAt: Date.now(),
    })

    return messageId
  },
})

export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId)
  },
})

export const getFileUploadLogs = query({
  args: {
    roomId: v.optional(v.id("rooms")),
    userId: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let baseQuery = ctx.db.query("auditLogs")

    let logsQuery
    if (args.roomId) {
      logsQuery = baseQuery.withIndex("by_room", (q) => q.eq("roomId", args.roomId))
    } else {
      logsQuery = baseQuery
    }

    const logs = await logsQuery
      .filter((q) => q.eq(q.field("actionType"), "file_upload"))
      .order("desc")
      .take(args.limit || 50)

    const logsWithUserInfo = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.actionBy)
        return {
          ...log,
          username: user?.username || "Unknown",
          userImageUrl: user?.imageUrl || "",
        }
      }),
    )

    return logsWithUserInfo
  },
})