"use client"

import type React from "react"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { Crown, Shield, User, UserPlus, UserMinus, Ban, Eye, Calendar, AlertTriangle } from "lucide-react"
import type { Id } from "@/convex/_generated/dataModel"

interface ProfileHoverCardProps {
  children: React.ReactNode
  userId: Id<"users">
  username: string
  name: string
  imageUrl: string
  role: string
  joinedAt?: number
  isBlocked?: boolean
  roomId: Id<"rooms">
  currentUserId: Id<"users">
  currentUserRole: string
  isCEO: boolean
  canManage: boolean
}

export function ProfileHoverCard({
  children,
  userId,
  username,
  name,
  imageUrl,
  role,
  joinedAt,
  isBlocked,
  roomId,
  currentUserId,
  currentUserRole,
  isCEO,
  canManage,
}: ProfileHoverCardProps) {
  const { toast } = useToast()
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const promoteToAdmin = useMutation(api.rooms.promoteToAdmin)
  const kickUser = useMutation(api.rooms.kickUser)
  const blockUser = useMutation(api.rooms.blockUser)
  const banUser = useMutation(api.users.banUser)

  const canPromote = canManage && role === "member" && !isBlocked
  const canKick = canManage && role !== "owner" && !isBlocked && userId !== currentUserId
  const canBlock = (isCEO || currentUserRole === "owner") && role !== "owner" && !isBlocked && userId !== currentUserId
  const canBan = isCEO && username !== "onlynazril7z" && userId !== currentUserId

  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case "owner":
        return <Crown className="w-4 h-4 text-yellow-500" />
      case "admin":
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (userRole: string) => {
    switch (userRole) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      default:
        return "outline"
    }
  }

  const handleAction = async () => {
    if (!selectedAction) return

    setIsLoading(true)
    try {
      switch (selectedAction) {
        case "promote":
          await promoteToAdmin({
            roomId,
            targetUserId: userId,
            promotedBy: currentUserId,
          })
          toast({
            title: "Success",
            description: `${username} promoted to admin successfully`,
          })
          break

        case "kick":
          await kickUser({
            roomId,
            targetUserId: userId,
            kickedBy: currentUserId,
            reason: reason || undefined,
          })
          toast({
            title: "Success",
            description: `${username} kicked from room successfully`,
          })
          break

        case "block":
          await blockUser({
            roomId,
            targetUserId: userId,
            blockedBy: currentUserId,
            reason: reason || undefined,
          })
          toast({
            title: "Success",
            description: `${username} blocked from room successfully`,
          })
          break

        case "ban":
          await banUser({
            targetUserId: userId,
            bannedBy: currentUserId,
            reason: reason || undefined,
          })
          toast({
            title: "Success",
            description: `${username} banned from application successfully`,
          })
          break
      }

      setSelectedAction(null)
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

  return (
    <>
      <HoverCard>
        <HoverCardTrigger asChild>{children}</HoverCardTrigger>
        <HoverCardContent className="w-80" side="top">
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={imageUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-lg">{username?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-semibold">{username}</h4>
                  {getRoleIcon(role)}
                </div>
                <p className="text-sm text-gray-600">{name}</p>
                <Badge variant={getRoleBadgeVariant(role)}>{role}</Badge>
                {isBlocked && (
                  <Badge variant="destructive" className="ml-2">
                    Blocked
                  </Badge>
                )}
              </div>
            </div>

            {joinedAt && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(joinedAt).toLocaleDateString()}</span>
              </div>
            )}

            {canManage && userId !== currentUserId && (
              <>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Quick Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {canPromote && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedAction("promote")}>
                        <UserPlus className="w-4 h-4 mr-1" />
                        Promote
                      </Button>
                    )}

                    {canKick && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedAction("kick")}>
                        <UserMinus className="w-4 h-4 mr-1" />
                        Kick
                      </Button>
                    )}

                    {canBlock && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedAction("block")}>
                        <Eye className="w-4 h-4 mr-1" />
                        Block
                      </Button>
                    )}

                    {canBan && (
                      <Button size="sm" variant="destructive" onClick={() => setSelectedAction("ban")}>
                        <Ban className="w-4 h-4 mr-1" />
                        Ban
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </HoverCardContent>
      </HoverCard>

      <Dialog open={!!selectedAction} onOpenChange={() => setSelectedAction(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm{" "}
              {selectedAction === "promote"
                ? "Promotion"
                : selectedAction === "kick"
                  ? "Kick"
                  : selectedAction === "block"
                    ? "Block"
                    : "Ban"}
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {selectedAction} <strong>{username}</strong>?
              {selectedAction === "ban" && " This will prevent them from accessing the entire application."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
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
              <Button variant="outline" onClick={() => setSelectedAction(null)}>
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
        </DialogContent>
      </Dialog>
    </>
  )
}
