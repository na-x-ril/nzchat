"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileHoverCard } from "@/components/profile-hover-card"
import { MessageContextMenu } from "@/components/message-context-menu"
import { FilePreview } from "@/components/file-preview"
import { Reply } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Id } from "@/convex/_generated/dataModel"

interface ChatMessageProps {
  messageId: Id<"messages">
  userId: Id<"users">
  username: string
  userImageUrl: string
  content: string
  timestamp: number
  isOwnMessage: boolean
  userRole?: string
  roomId: Id<"rooms">
  currentUserId: Id<"users">
  currentUserRole: string
  isCEO: boolean
  canManage: boolean
  isDeleted?: boolean
  deletedFor?: "me" | "everyone"
  fileAttachment?: {
    fileId: Id<"_storage">
    fileName: string
    fileType: string
    fileSize: number
  }
  replyTo?: {
    messageId: Id<"messages">
    content: string
    username: string
  }
  onReply: (messageId: Id<"messages">, content: string, username: string) => void
}

export function ChatMessage({
  messageId,
  userId,
  username,
  userImageUrl,
  content,
  timestamp,
  isOwnMessage,
  userRole = "member",
  roomId,
  currentUserId,
  currentUserRole,
  isCEO,
  canManage,
  isDeleted = false,
  deletedFor,
  fileAttachment,
  replyTo,
  onReply,
}: ChatMessageProps) {
  // Get username color based on role
  const getUsernameColor = (role: string, isOwn: boolean) => {
    if (isOwn) {
      switch (role) {
        case "owner":
          return "text-yellow-200" // Light gold for owner
        case "admin":
          return "text-purple-200" // Light purple for admin
        default:
          return "text-blue-100" // Light blue for member
      }
    } else {
      switch (role) {
        case "owner":
          return "text-yellow-600" // Gold for owner
        case "admin":
          return "text-purple-600" // Purple for admin
        default:
          return "text-gray-600" // Gray for member
      }
    }
  }

  // Don't render if message is deleted for everyone
  if (isDeleted && deletedFor === "everyone") {
    return (
      <div className={cn("flex gap-3 mb-4 opacity-50", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={userImageUrl || "/placeholder.svg"} />
            <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className={cn("flex flex-col max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
          <div
            className={cn(
              "rounded-2xl px-4 py-2 max-w-full break-words bg-gray-200 text-gray-500 italic relative",
              isOwnMessage ? "rounded-br-md" : "rounded-bl-md",
            )}
          >
            <p className="text-sm">This message was deleted</p>
          </div>
        </div>
      </div>
    )
  }

  // Show deleted for me message
  if (isDeleted && deletedFor === "me") {
    return (
      <div className={cn("flex gap-3 mb-4 opacity-50", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
        <div className="flex-shrink-0">
          <Avatar className="w-10 h-10">
            <AvatarImage src={userImageUrl || "/placeholder.svg"} />
            <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </div>
        <div className={cn("flex flex-col max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
          <div
            className={cn(
              "rounded-2xl px-4 py-2 max-w-full break-words bg-gray-100 text-gray-400 italic relative",
              isOwnMessage ? "rounded-br-md" : "rounded-bl-md",
            )}
          >
            <p className="text-sm">You deleted this message</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex gap-3 mb-4", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
      <div className="flex-shrink-0">
        <ProfileHoverCard
          userId={userId}
          username={username}
          name={username}
          imageUrl={userImageUrl}
          role={userRole}
          roomId={roomId}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isCEO={isCEO}
          canManage={canManage && !isOwnMessage}
        >
          <Avatar className="w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all">
            <AvatarImage src={userImageUrl || "/placeholder.svg"} />
            <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </ProfileHoverCard>
      </div>

      <div className={cn("flex flex-col max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
        <MessageContextMenu
          messageId={messageId}
          messageContent={content}
          messageUserId={userId}
          messageUsername={username}
          isOwnMessage={isOwnMessage}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          isCEO={isCEO}
          onReply={onReply}
        >
          <div className="cursor-pointer">
            {replyTo && (
              <div
                className={cn(
                  "mb-2 p-2 rounded-lg border-l-4 bg-gray-50 text-xs",
                  isOwnMessage ? "border-blue-300" : "border-gray-300",
                )}
              >
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Reply className="w-3 h-3" />
                  <span className="font-medium">{replyTo.username}</span>
                </div>
                <p className="text-gray-700 truncate">{replyTo.content}</p>
              </div>
            )}

            <div
              className={cn(
                "rounded-2xl px-4 py-3 max-w-full break-words transition-all hover:shadow-md relative",
                isOwnMessage
                  ? "bg-blue-500 text-white rounded-br-md hover:bg-blue-600"
                  : "bg-gray-100 text-gray-900 rounded-bl-md hover:bg-gray-200",
              )}
            >
              {/* Username inside message bubble with role color */}
              <div className={cn("flex mb-2", isOwnMessage ? "justify-end" : "justify-start")}>
                <ProfileHoverCard
                  userId={userId}
                  username={username}
                  name={username}
                  imageUrl={userImageUrl}
                  role={userRole}
                  roomId={roomId}
                  currentUserId={currentUserId}
                  currentUserRole={currentUserRole}
                  isCEO={isCEO}
                  canManage={canManage && !isOwnMessage}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold cursor-pointer hover:underline",
                      getUsernameColor(userRole, isOwnMessage),
                    )}
                  >
                    {username}
                  </span>
                </ProfileHoverCard>
              </div>

              {/* File attachment preview */}
              {fileAttachment && (
                <div className="mb-2">
                  <FilePreview
                    fileId={fileAttachment.fileId}
                    fileName={fileAttachment.fileName}
                    fileType={fileAttachment.fileType}
                    fileSize={fileAttachment.fileSize}
                  />
                </div>
              )}

              {/* Message content */}
              <p className={cn("flex text-sm leading-relaxed", isOwnMessage ? "justify-end" : "justify-start")}>{content} {fileAttachment ? fileAttachment.fileId : ""}</p>

              {/* Timestamp in bottom right corner */}
              <div className={cn("text-xs mt-2 flex justify-end", isOwnMessage ? "text-blue-100" : "text-gray-500")}>
                <span>{new Date(timestamp).toLocaleTimeString()}</span>
                {/* Message status indicators for own messages */}
                {isOwnMessage && <span className="ml-1">✓✓</span>}
              </div>
            </div>
          </div>
        </MessageContextMenu>
      </div>
    </div>
  )
}
