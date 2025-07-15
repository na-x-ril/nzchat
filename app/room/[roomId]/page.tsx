"use client"

import type React from "react"
import { use } from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Users, UserPlus, Crown } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import type { Id } from "@/convex/_generated/dataModel"
import { UserManagementDialog } from "@/components/user-management-dialog"
import { ChatMessage } from "@/components/chat-message"
import { ReplyInput } from "@/components/reply-input"
import { checkCEO } from "@/packages/shared/admin"

interface RoomPageProps {
  params: Promise<{
    roomId: Id<"rooms">
  }>
}

export default function RoomPage({ params }: RoomPageProps) {
  const resolvedParams = use(params)
  const { user } = useUser()
  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip")
  const room = useQuery(api.rooms.getRoom, { roomId: resolvedParams.roomId as Id<"rooms"> })

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
  const { toast } = useToast()

  const [isJoining, setIsJoining] = useState(false)
  const [mediaLoaded, setMediaLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputContainerRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false)
  const [inputHeight, setInputHeight] = useState(0)
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [newMessagesCount, setNewMessagesCount] = useState(0)
  const lastSeenMessageTimeRef = useRef<number>(Date.now())

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "center" })
      setShowScrollButton(false)
      setNewMessagesCount(0)
      lastSeenMessageTimeRef.current = Date.now()
    }
  }

  const checkScrollPosition = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      setShowScrollButton(!isAtBottom)
    }
  }

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setNewMessagesCount(0)
      setMediaLoaded(true)
      return
    }

    // Count new messages from other users
    const newMessages = messages.filter(
      (msg) => msg._creationTime > lastSeenMessageTimeRef.current && msg.userId !== currentUser?._id
    )
    setNewMessagesCount(newMessages.length)

    // Show scroll button if not at bottom and new messages arrive
    if (newMessages.length > 0 && messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 100
      if (!isAtBottom) {
        setShowScrollButton(true)
      }
    }
  }, [messages, currentUser])

  useEffect(() => {
    if (!messages || messages.length === 0) {
      setMediaLoaded(true)
      return
    }

    let loadedImages = 0
    const totalImages = messages.reduce((count, msg) => {
      let imageCount = 0 // Only count actual images
      if (msg.fileAttachment && msg.fileAttachment.fileType.startsWith("image/")) {
        imageCount += 1
      }
      return count + imageCount
    }, 0)

    if (totalImages === 0) {
      setMediaLoaded(true)
      return
    }

    const handleImageLoad = () => {
      loadedImages += 1
      if (loadedImages === totalImages) {
        setMediaLoaded(true)
      }
    }

    const handleImageError = () => {
      loadedImages += 1
      if (loadedImages === totalImages) {
        setMediaLoaded(true)
      }
    }

    const images = document.querySelectorAll(".message-container img") as NodeListOf<HTMLImageElement>
    images.forEach((img) => {
      if (img.complete) {
        handleImageLoad()
      } else {
        img.addEventListener("load", handleImageLoad)
        img.addEventListener("error", handleImageError)
      }
    })

    return () => {
      images.forEach((img) => {
        img.removeEventListener("load", handleImageLoad)
        img.removeEventListener("error", handleImageError)
      })
    }
  }, [messages])

  useEffect(() => {
    const container = messagesContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollPosition)
      return () => container.removeEventListener("scroll", checkScrollPosition)
    }
  }, [])

  // Auto-scroll to bottom when entering room or new messages arrive and user is at bottom
  useEffect(() => {
    if (mediaLoaded && messagesEndRef.current && messages && messages.length > 0) {
      const isAtBottom =
        messagesContainerRef.current &&
        messagesContainerRef.current.scrollHeight - messagesContainerRef.current.scrollTop - messagesContainerRef.current.clientHeight < 100
      if (isAtBottom || !showScrollButton) {
        scrollToBottom()
      }
    }
  }, [mediaLoaded, messages])

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      setInputHeight(entry.contentRect.height)
    })

    if (inputContainerRef.current) {
      observer.observe(inputContainerRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleHeaderClick = () => {
    setIsUserManagementOpen(true)
  }

  const [replyTo, setReplyTo] = useState<{
    messageId: Id<"messages">
    content: string
    username: string
  } | null>(null)

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

  const handleReply = (messageId: Id<"messages">, content: string, username: string) => {
    setReplyTo({ messageId, content, username })
  }

  const handleCancelReply = () => {
    setReplyTo(null)
  }

  const getUserRoleFromMembers = (userId: Id<"users">) => {
    const member = roomMembers?.find((m) => m.userId === userId)
    return member?.role || "visitor"
  }

  const canSendMessages =
    userRole === "member" || userRole === "admin" || userRole === "owner" || checkCEO(currentUser?.email)
  const isOwner = userRole === "owner" || checkCEO(currentUser?.email)
  const isAdmin = userRole === "admin" || isOwner
  const canManage = isOwner || isAdmin

  // Function to format date for separators
  const formatDateSeparator = (timestamp: number) => {
    const messageDate = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return "Today"
    } else if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday"
    } else {
      return messageDate.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    }
  }

  // Group messages by date
  const messagesWithSequenceAndDate = messages?.reduce((acc, msg, index) => {
    const isSameSenderAsPrevious = index > 0 && messages[index - 1].userId === msg.userId
    const isSameSenderAsNext = index < messages.length - 1 && messages[index + 1].userId === msg.userId
    const messageDate = new Date(msg._creationTime)
    const dateKey = messageDate.toDateString()

    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push({ ...msg, isSameSenderAsPrevious, isSameSenderAsNext })
    return acc
  }, {} as Record<string, any[]>) || {}

  if (!room || !currentUser) {
    return (
      <div className="bg-gray-50 dark:bg-[#090040] lg:dark:bg-[#090030] flex items-center justify-center overflow-hidden fixed inset-0">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading room...</h2>
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-center w-full bg-gray-50 dark:bg-[#090040] lg:dark:bg-[#090030] lg:overflow-y-auto">
      <div className="w-full lg:w-[40%] h-[100dvh] flex flex-col justify-center">
        <header className="bg-white max-w-[inherit] dark:bg-[#471396] lg:dark:bg-[#471386] shadow-sm border-b fixed top-0 left-0 right-0 h-16 z-10">
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
                    className="text-lg md:text-xl lg:text-2xl font-bold flex items-center break-words line-clamp-2"
                  >
                    {room.name}
                    {isOwner && <Crown className="w-4 h-4 ml-2 text-yellow-500 shrink-0" />}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-200">
                    {room.memberCount || 0} members
                  </p>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 mt-16 max-sm:overflow-y-auto lg:relative" ref={messagesContainerRef}>
          <div className="mx-auto space-y-2 pt-2 px-4 pb-16 message-container">
            {Object.entries(messagesWithSequenceAndDate).length > 0 ? (
              Object.entries(messagesWithSequenceAndDate).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="text-center my-4">
                    <span className="inline-block px-4 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm font-medium">
                      {formatDateSeparator(new Date(date).getTime())}
                    </span>
                  </div>
                  {dateMessages.map((msg) => (
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
                      isSameSenderAsPrevious={msg.isSameSenderAsPrevious}
                      isSameSenderAsNext={msg.isSameSenderAsNext}
                      useMarkdown={msg.useMarkdown}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-16 space-y-2">
                <Users className="w-10 h-10 text-gray-300" />
                <p className="text-base font-medium">No messages yet</p>
                <p className="text-sm text-gray-400">
                  {canSendMessages
                    ? "Start the conversation by sending a message!"
                    : "Messages will appear here once available."}
                </p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {showScrollButton && (
          <div className="fixed bottom-20 right-4 z-50">
            <Button
              className="relative rounded-full p-3 dark:bg-[#471396] dark:text-white"
              onClick={scrollToBottom}
            >
              <svg width="15" height="auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4.5v15m0 0-6-5.625m6 5.625 6-5.625"/>
              </svg>
              {newMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {newMessagesCount > 9 ? "9+" : newMessagesCount}
                </span>
              )}
            </Button>
          </div>
        )}

        {userRole === "visitor" && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 px-3 py-2 bg-blue-50 rounded-lg shadow z-40">
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
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 mb-4 p-4 bg-red-50 rounded-lg shadow z-40">
            <div className="text-center">
              <h3 className="font-medium text-red-900">You are blocked from this room</h3>
              <p className="text-sm text-red-700">You cannot send messages or participate in this room</p>
            </div>
          </div>
        )}

        {canSendMessages && (
          <div ref={inputContainerRef}>
            <ReplyInput
              replyTo={replyTo}
              onCancelReply={handleCancelReply}
              roomId={resolvedParams.roomId as Id<"rooms">}
              userId={currentUser._id}
              onMessageSent={scrollToBottom}
            />
          </div>
        )}

        {!canSendMessages && userRole !== "visitor" && userRole !== "blocked" && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 text-center text-gray-500 text-sm bg-white px-3 py-2 rounded shadow z-40">
            You don't have permission to send messages in this room
          </div>
        )}

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
    </div>
  )
}