"use client"

import type React from "react"
import { use } from "react"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ArrowLeft, Users, UserPlus, Crown } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { UserManagementDialog } from "@/components/user-management-dialog"
import { ChatMessage } from "@/components/chat-message"
import { ReplyInput } from "@/components/reply-input"
import { checkCEO } from "@/packages/shared/admin"
import { useBreakpoint } from "@/hooks/use-breakpoint"

interface RoomPageProps {
  params: Promise<{
    roomId: string
  }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params)
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip")
  const room = useQuery(api.rooms.getRoom, { roomId: resolvedParams.roomId as Id<"rooms"> })
  const breakpoint = useBreakpoint();

  // Pass userId only if currentUser exists
  const messages = useQuery(
    api.messages.getMessages,
    currentUser
      ? { roomId: resolvedParams.roomId as Id<"rooms">, userId: currentUser._id }
      : { roomId: resolvedParams.roomId as Id<"rooms"> },
  )

  const roomMembers = useQuery(api.rooms.getRoomMembers, { roomId: resolvedParams.roomId as Id<"rooms"> })
  const userRole = useQuery(
    api.rooms.getUserRole,
    currentUser ? { roomId: resolvedParams.roomId as Id<"rooms">, userId: currentUser._id } : "skip",
  )

  const joinRoom = useMutation(api.rooms.joinRoom)
  const sendMessage = useMutation(api.messages.sendMessage)
  const { toast } = useToast()

  const [message, setMessage] = useState("")
  const [isJoining, setIsJoining] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [hasSelectedFile, setHasSelectedFile] = useState(false)

  const handleHeaderClick = () => {
    setIsUserManagementOpen(true)
  }

  const [replyTo, setReplyTo] = useState<{
    messageId: Id<"messages">
    content: string
    username: string
  } | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      scrollToBottom()
    })()
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    (async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
      scrollToBottom()
    })()
  }, [replyTo, hasSelectedFile])

  const handleJoinRoom = async () => {
    if (!currentUser || !room) return

    setIsJoining(true)
    try {
      await joinRoom({
        roomId: room._id,
        userId: currentUser._id,
      })
      toast({
        title: "Joined Room!",
        description: `You are now a member of ${room.name}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to join room. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsJoining(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !currentUser || !room) return

    setIsSending(true)
    try {
      await sendMessage({
        roomId: room._id,
        userId: currentUser._id,
        content: message.trim(),
        replyToId: replyTo?.messageId,
      })
      setMessage("")
      setReplyTo(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const getWrapperPaddingBottom = () => {
    if (hasSelectedFile && replyTo) {
      if (breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl") return "13rem";
      if (breakpoint === "sm" || breakpoint === "base") return "13rem";
    }
    if (hasSelectedFile) {
      if (breakpoint === "lg" || breakpoint === "xl" || breakpoint === "2xl") return "10.3rem";
      if (breakpoint === "sm" || breakpoint === "base") return "10.5rem";
    }
    if (replyTo) {
      if (breakpoint === "sm" || breakpoint === "base") return "9rem";
    }
    return "6rem";
  };

  const handleReply = (messageId: Id<"messages">, content: string, username: string) => {
    setReplyTo({ messageId, content, username })
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  // Get user role from room members for message display
  const getUserRoleFromMembers = (userId: Id<"users">) => {
    const member = roomMembers?.find((m) => m.userId === userId)
    return member?.role || "visitor"
  }

  const canSendMessages =
    userRole === "member" || userRole === "admin" || userRole === "owner" || checkCEO(currentUser?.email)
  const isOwner = userRole === "owner" || checkCEO(currentUser?.email)
  const isAdmin = userRole === "admin" || isOwner
  const canManage = isOwner || isAdmin

  if (!room || !currentUser) {
    return (
      <div className="bg-gray-50 flex items-center justify-center overflow-hidden fixed inset-0">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading room...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[100dvh] bg-gray-50 flex flex-col overflow-y-auto">
      {/* Fixed Header */}
      <header className="bg-white w-full shadow-sm border-b fixed top-0 left-0 right-0 h-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 max-w-full">
              <Link href="/home">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <button
                onClick={handleHeaderClick}
                className="text-left flex flex-col max-w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <h1
                  title={room.name}
                  className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold flex items-center break-words line-clamp-2"
                >
                  {room.name}
                  {isOwner && <Crown className="w-4 h-4 ml-2 text-yellow-500 shrink-0" />}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  {room.memberCount || 0} members
                </p>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 pt-[4.5rem]" style={{ paddingBottom: getWrapperPaddingBottom() }}>
          <div className={`max-w-4xl mx-auto space-y-2 delay-300 transition-all duration-300`}>
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <ChatMessage
                  key={msg._id}
                  messageId={msg._id}
                  userId={msg.userId}
                  username={msg.username}
                  userImageUrl={msg.userImageUrl}
                  content={msg.content}
                  timestamp={msg._creationTime}
                  isOwnMessage={msg.userId === currentUser._id}
                  userRole={getUserRoleFromMembers(msg.userId)}
                  roomId={resolvedParams.roomId as Id<"rooms">}
                  currentUserId={currentUser._id}
                  currentUserRole={userRole || "visitor"}
                  isCEO={checkCEO(currentUser?.email)}
                  canManage={canManage}
                  isDeleted={msg.isDeleted}
                  fileAttachment={msg.fileAttachment}
                  deletedFor={msg.deletedFor as "me" | "everyone" | undefined}
                  replyTo={msg.replyTo}
                  onReply={handleReply}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-16 space-y-2">
                <Users className="w-10 h-10 text-gray-300" />
                <p className="text-base font-medium">No messages yet</p>
                <p className="text-sm text-gray-400">
                  {canSendMessages ? "Start the conversation by sending a message!" : "Messages will appear here once available."}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Fixed Input Area */}
        <div className="border-t w-full bg-white p-4 fixed bottom-0 z-10 shadow-lg transition-all diration-300">
          <div className="max-w-4xl mx-auto">
            {userRole === "visitor" && (
              <div className="px-3 py-2 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Join this room to participate</h3>
                    <p className="text-sm text-blue-700">You're currently viewing as a visitor</p>
                  </div>
                  <Button onClick={handleJoinRoom} disabled={isJoining}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {isJoining ? "Joining..." : "Join Room"}
                  </Button>
                </div>
              </div>
            )}

            {userRole === "blocked" && (
              <div className="mb-4 p-4 bg-red-50 rounded-lg">
                <div className="text-center">
                  <h3 className="font-medium text-red-900">You are blocked from this room</h3>
                  <p className="text-sm text-red-700">You cannot send messages or participate in this room</p>
                </div>
              </div>
            )}

            {canSendMessages && (
              <ReplyInput
                replyTo={replyTo}
                message={message}
                onMessageChange={setMessage}
                setHasSelectedFile={setHasSelectedFile}
                onSendMessage={handleSendMessage}
                onCancelReply={handleCancelReply}
                isSending={isSending}
                roomId={resolvedParams.roomId as Id<"rooms">}
                userId={currentUser._id}
              />
            )}

            {!canSendMessages && userRole !== "visitor" && userRole !== "blocked" && (
              <div className="text-center text-gray-500 text-sm">
                You don't have permission to send messages in this room
              </div>
            )}
          </div>
        </div>
      </div>

     <UserManagementDialog
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        room={{
          name: room.name,
          description: room.description,
          memberCount: room.memberCount
        }}
        roomId={resolvedParams.roomId as Id<"rooms">}
        currentUserId={currentUser._id}
        currentUserRole={userRole || "visitor"}
        isCEO={checkCEO(currentUser?.email)}
      />
    </div>
  )
}
