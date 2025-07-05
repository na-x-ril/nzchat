"use client"

import type React from "react"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Reply, Trash2, AlertTriangle, Copy } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

interface MessageContextMenuProps {
  children: React.ReactNode
  messageId: Id<"messages">
  messageContent: string
  messageUserId: Id<"users">
  messageUsername: string
  isOwnMessage: boolean
  currentUserId: Id<"users">
  currentUserRole: string
  isCEO: boolean
  onReply: (messageId: Id<"messages">, content: string, username: string) => void
}

export function MessageContextMenu({
  children,
  messageId,
  messageContent,
  messageUserId,
  messageUsername,
  isOwnMessage,
  currentUserId,
  currentUserRole,
  isCEO,
  onReply,
}: MessageContextMenuProps) {
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteType, setDeleteType] = useState<"for_me" | "for_everyone" | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteMessage = useMutation(api.messages.deleteMessage)

  const canDeleteForEveryone = isCEO || currentUserRole === "owner" || currentUserRole === "admin" || isOwnMessage
  const canDeleteForMe = true // Everyone can delete messages for themselves

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(messageContent)
    toast({
      title: "Copied",
      description: "Message copied to clipboard",
    })
  }

  const handleReply = () => {
    onReply(messageId, messageContent, messageUsername)
  }

  const handleDeleteClick = (type: "for_me" | "for_everyone") => {
    setDeleteType(type)
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    if (!deleteType) return

    setIsDeleting(true)
    try {
      await deleteMessage({
        messageId,
        deletedBy: currentUserId,
        deleteType,
      })

      toast({
        title: "Message Deleted",
        description: deleteType === "for_everyone" ? "Message deleted for everyone" : "Message deleted for you",
      })

      setShowDeleteDialog(false)
      setDeleteType(null)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete message",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuItem onClick={handleReply}>
            <Reply className="w-4 h-4 mr-2" />
            Reply
          </ContextMenuItem>

          <ContextMenuItem onClick={handleCopyMessage}>
            <Copy className="w-4 h-4 mr-2" />
            Copy Message
          </ContextMenuItem>

          <ContextMenuSeparator />

          {canDeleteForMe && (
            <ContextMenuItem onClick={() => handleDeleteClick("for_me")} className="text-orange-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete for Me
            </ContextMenuItem>
          )}

          {canDeleteForEveryone && (
            <ContextMenuItem onClick={() => handleDeleteClick("for_everyone")} className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete for Everyone
            </ContextMenuItem>
          )}
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Message
            </DialogTitle>
            <DialogDescription>
              {deleteType === "for_everyone"
                ? "This message will be deleted for everyone in the chat. This action cannot be undone."
                : "This message will be deleted for you only. Other participants will still see it."}
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700 italic">"{messageContent}"</p>
            <p className="text-xs text-gray-500 mt-1">- {messageUsername}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
