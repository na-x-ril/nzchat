"use client"

import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Crown, Shield, User, UserPlus, UserMinus, Ban, AlertTriangle, Eye, EyeOff } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"
import { useClerk, useUser } from "@clerk/nextjs"

interface UserManagementDialogProps {
  isOpen: boolean
  onClose: () => void
  room: {
    name: string
    description?: string
    memberCount?: number
  }
  roomId: Id<"rooms">
  currentUserId: Id<"users">
  currentUserRole: string
  isCEO: boolean
}

export function UserManagementDialog({
  isOpen,
  onClose,
  room,
  roomId,
  currentUserId,
  currentUserRole,
  isCEO,
}: UserManagementDialogProps) {
  const { toast } = useToast()
  const { user, isLoaded } = useUser();
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(null)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { signOut } = useClerk();

  const userData = useQuery(api.users.getUserByClerkId, user ? { clerkId: user.id } : "skip");

  const roomMembers = useQuery(api.rooms.getRoomMembers, { roomId })
  const promoteToAdmin = useMutation(api.rooms.promoteToAdmin)
  const kickUser = useMutation(api.rooms.kickUser)
  const blockUser = useMutation(api.rooms.blockUser)
  const banUser = useMutation(api.users.banUser)

  const canManageUsers = isCEO || currentUserRole === "owner" || currentUserRole === "admin"
  const canPromote = isCEO || currentUserRole === "owner" || currentUserRole === "admin"
  const canKick = isCEO || currentUserRole === "owner" || currentUserRole === "admin"
  const canBlock = isCEO || currentUserRole === "owner"
  const canBan = isCEO

  useEffect(() => {
    if (!isLoaded || !userData) return;

    if (userData.isBanned) {
      signOut();
    }
  }, [isLoaded, userData, signOut]);

  if (!isLoaded || !userData) return null;

  const handleAction = async () => {
    if (!selectedUserId || !selectedAction) return

    setIsLoading(true)
    try {
      switch (selectedAction) {
        case "promote":
          await promoteToAdmin({
            roomId,
            targetUserId: selectedUserId,
            promotedBy: currentUserId,
          })
          toast({
            title: "Success",
            description: "User promoted to admin successfully",
          })
          break

        case "kick":
          await kickUser({
            roomId,
            targetUserId: selectedUserId,
            kickedBy: currentUserId,
            reason: reason || undefined,
          })
          toast({
            title: "Success",
            description: "User kicked from room successfully",
          })
          break

        case "block":
          await blockUser({
            roomId,
            targetUserId: selectedUserId,
            blockedBy: currentUserId,
            reason: reason || undefined,
          })
          toast({
            title: "Success",
            description: "User blocked from room successfully",
          })
          break

        case "ban":
          await banUser({
            targetUserId: selectedUserId,
            bannedBy: currentUserId,
            reason: reason || undefined,
          })
          toast({
            title: "Success",
            description: "User banned from application successfully",
          })
          break
      }

      setSelectedAction(null)
      setSelectedUserId(null)
      setReason("")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Action failed",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  if (!canManageUsers) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex flex-col gap-1">
            <span className="flex items-center gap-2 text-lg font-bold">
              {room.name}
            </span>
            {room.description && (
              <span className="text-sm text-gray-500">{room.description}</span>
            )}
            <span className="text-xs text-gray-400">
              {room.memberCount || 0} members
            </span>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm text-gray-600">
            <Shield className="w-5 h-5" />
            Manage room members, roles, and permissions
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div className="space-y-4">
            {roomMembers?.map((member) => (
              <div key={member._id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={member.imageUrl || "/placeholder.svg"} />
                    <AvatarFallback>{member.username?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{member.username}</span>
                      {getRoleIcon(member.role)}
                      <Badge variant={getRoleBadgeVariant(member.role)}>{member.role}</Badge>
                      {member.isBlocked && (
                        <Badge variant="destructive">
                          <EyeOff className="w-3 h-3 mr-1" />
                          Blocked
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{member.name}</p>
                  </div>
                </div>

                {member.userId !== currentUserId && (
                  <div className="flex items-center gap-2">
                    {canPromote && member.role === "member" && !member.isBlocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAction("promote")
                          setSelectedUserId(member.userId)
                        }}
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Promote
                      </Button>
                    )}

                    {canKick && member.role !== "owner" && !member.isBlocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAction("kick")
                          setSelectedUserId(member.userId)
                        }}
                      >
                        <UserMinus className="w-4 h-4 mr-1" />
                        Kick
                      </Button>
                    )}

                    {canBlock && member.role !== "owner" && !member.isBlocked && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedAction("block")
                          setSelectedUserId(member.userId)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Block
                      </Button>
                    )}

                    {canBan && member.email !== "onlynazril7z@gmail.com" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedAction("ban")
                          setSelectedUserId(member.userId)
                        }}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Ban
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>

        {selectedAction && selectedUserId && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-medium">
                  Confirm{" "}
                  {selectedAction === "promote"
                    ? "Promotion"
                    : selectedAction === "kick"
                      ? "Kick"
                      : selectedAction === "block"
                        ? "Block"
                        : "Ban"}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reason">Reason (Optional)</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={`Enter reason for ${selectedAction}...`}
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAction(null)
                    setSelectedUserId(null)
                    setReason("")
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant={selectedAction === "ban" ? "destructive" : "default"}
                  onClick={handleAction}
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : `Confirm ${selectedAction}`}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
