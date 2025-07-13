"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileHoverCard } from "@/components/profile-hover-card";
import { MessageContextMenu } from "@/components/message-context-menu";
import { FilePreview } from "@/components/file-preview";
import { Reply } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";
import { MarkdownRenderer } from "./markdown-renderer";

interface ChatMessageProps {
  messageId: Id<"messages">;
  userId: Id<"users">;
  username: string;
  userImageUrl: string;
  content: string;
  timestamp: number;
  isOwnMessage: boolean;
  userRole?: string;
  roomId: Id<"rooms">;
  currentUserId: Id<"users">;
  currentUserRole: string;
  isCEO: boolean;
  canManage: boolean;
  isDeleted?: boolean;
  deletedFor?: "me" | "everyone";
  fileAttachment?: {
    fileId: Id<"_storage">;
    fileName: string;
    fileType: string;
    fileSize: number;
  };
  replyTo?: {
    messageId: Id<"messages">;
    content: string;
    username: string;
  };
  onReply: (messageId: Id<"messages">, content: string, username: string) => void;
  isSameSenderAsPrevious?: boolean;
  isSameSenderAsNext?: boolean;
  useMarkdown?: boolean;
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
  isSameSenderAsPrevious = false,
  isSameSenderAsNext = false,
  useMarkdown = false,
}: ChatMessageProps) {
  const getUsernameColor = (role: string, isOwn: boolean) => {
    if (isOwn) {
      switch (role) {
        case "owner":
          return "text-yellow-200";
        case "admin":
          return "text-purple-200";
        default:
          return "text-blue-100";
      }
    } else {
      switch (role) {
        case "owner":
          return "text-yellow-600";
        case "admin":
          return "text-purple-600";
        default:
          return "text-gray-600";
      }
    }
  };

  const showAvatar = !isSameSenderAsPrevious;

  const messageBorderRadius = cn(
    "rounded-2xl lg:rounded-3xl",
    isOwnMessage
      ? {
          "rounded-tr-[8px]":
            (!isSameSenderAsPrevious && isSameSenderAsNext) ||
            (isSameSenderAsPrevious && !isSameSenderAsNext),
          "rounded-tr-[8px] rounded-br-[8px]":
            isSameSenderAsPrevious && isSameSenderAsNext,
        }
      : {
          "rounded-tl-[8px]":
            (!isSameSenderAsPrevious && isSameSenderAsNext) ||
            (isSameSenderAsPrevious && !isSameSenderAsNext),
          "rounded-tl-[8px] rounded-bl-[8px]":
            isSameSenderAsPrevious && isSameSenderAsNext,
        }
  );

  if (isDeleted && deletedFor === "everyone") {
    return (
      <div className={cn("flex gap-3 mb-2 px-2 opacity-80", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
        <div className="flex-shrink-0 w-10 h-10" style={{ visibility: showAvatar ? "visible" : "hidden" }}>
          {showAvatar && (
            <Avatar className="w-10 h-10">
              <AvatarImage src={userImageUrl || "/placeholder.svg"} className="message-image" />
              <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className={cn("flex flex-col max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
          <div
            className={cn(
              "px-4 py-3 max-w-full break-words bg-gray-200 text-gray-500 italic relative",
              messageBorderRadius
            )}
          >
            <p className="text-sm">This message was deleted</p>
          </div>
        </div>
      </div>
    );
  }

  if (isDeleted && deletedFor === "me") {
    return (
      <div className={cn("flex gap-3 mb-2 px-2 opacity-80", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
        <div className="flex-shrink-0 w-10 h-10" style={{ visibility: showAvatar ? "visible" : "hidden" }}>
          {showAvatar && (
            <Avatar className="w-10 h-10">
              <AvatarImage src={userImageUrl || "/placeholder.svg"} className="message-image" />
              <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          )}
        </div>
        <div className={cn("flex flex-col max-w-[70%]", isOwnMessage ? "items-end" : "items-start")}>
          <div
            className={cn(
              "px-4 py-3 max-w-full break-words bg-gray-100 text-gray-400 italic relative",
              messageBorderRadius
            )}
          >
            <p className="text-sm">You deleted this message</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 mb-2 px-2", isOwnMessage ? "flex-row-reverse" : "flex-row")}>
      <div className="flex-shrink-0 w-10 h-10" style={{ visibility: showAvatar ? "visible" : "hidden" }}>
        {showAvatar && (
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
            <Avatar
              className={cn(
                "w-10 h-10 cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all",
                isOwnMessage ? "self-start" : ""
              )}
            >
              <AvatarImage src={userImageUrl || "/placeholder.svg"} className="message-image" />
              <AvatarFallback>{username?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </ProfileHoverCard>
        )}
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
                  isOwnMessage ? "border-blue-300" : "border-gray-300"
                )}
              >
                <div className="flex items-center gap-1 text-gray-600 mb-1">
                  <Reply className="w-3 h-3" />
                  <span className="font-medium">{replyTo.username}</span>
                </div>
                <ReactMarkdown
                  remarkPlugins={[remarkBreaks]}
                  components={{
                    p: ({ node, ...props }) => <p className="truncate" {...props} />,
                  }}
                >
                  {replyTo.content}
                </ReactMarkdown>
              </div>
            )}

            <div
              className={cn(
                "px-4 py-3 pb-1 pt-2 pr-3 max-w-full break-words transition-all hover:shadow-md relative",
                isOwnMessage
                  ? "bg-purple-800 text-white hover:bg-blue-600"
                  : "bg-gray-300 text-gray-900 hover:bg-gray-300",
                messageBorderRadius
              )}
            >
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
                      getUsernameColor(userRole, isOwnMessage)
                    )}
                  >
                    {username}
                  </span>
                </ProfileHoverCard>
              </div>

              {fileAttachment && (
                <div className="mb-2 w-full max-w-full">
                  <FilePreview
                    fileId={fileAttachment.fileId}
                    fileName={fileAttachment.fileName}
                    fileType={fileAttachment.fileType}
                    fileSize={fileAttachment.fileSize}
                  />
                </div>
              )}

              {useMarkdown ? (
                <MarkdownRenderer content={content}/>
              ) : (
                <p
                  className={cn(
                    "mb-2",
                    content.includes("\n") ? "whitespace-pre-wrap" : "whitespace-nowrap"
                  )}
                >
                  {content}
                </p>
              )}

              <div
                className={cn("text-[0.65rem] mt-2 flex justify-end", isOwnMessage ? "text-blue-100" : "text-gray-500")}
              >
                <span>{new Date(timestamp).toLocaleTimeString()}</span>
                {isOwnMessage && <span className="ml-1">✓✓</span>}
              </div>
            </div>
          </div>
        </MessageContextMenu>
      </div>
    </div>
  );
}