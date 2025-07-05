"use client"

import type React from "react"

import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useUser } from "@clerk/nextjs"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { UserButton } from "@clerk/nextjs"
import { Plus, Users, MessageCircle } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { ConnectionSpeedDialog } from "@/components/connection-speed-dialog"

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const currentUser = useQuery(api.users.getCurrentUser, user ? { clerkId: user.id } : "skip")
  const rooms = useQuery(api.rooms.getAllRooms)
  const createRoom = useMutation(api.rooms.createRoom)
  const { toast } = useToast()

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [roomName, setRoomName] = useState("")
  const [roomDescription, setRoomDescription] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [showSpeedDialog, setShowSpeedDialog] = useState(false)

  // Redirect to onboarding if user exists but no currentUser record
  useEffect(() => {
    if (isLoaded && user && currentUser === null) {
      router.push("/onboarding")
    }
  }, [isLoaded, user, currentUser, router])

  // Show connection speed dialog if needed
  useEffect(() => {
    if (currentUser && currentUser.showSpeedDialog !== false) {
      setShowSpeedDialog(true)
    }
  }, [currentUser])

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!roomName.trim() || !currentUser) return

    setIsCreating(true)
    try {
      const roomId = await createRoom({
        name: roomName.trim(),
        description: roomDescription.trim(),
        ownerId: currentUser._id,
      })

      toast({
        title: "Room Created!",
        description: `${roomName} has been created successfully.`,
      })

      setRoomName("")
      setRoomDescription("")
      setIsCreateDialogOpen(false)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
        </div>
      </div>
    )
  }

  if (!user) {
    router.push("/")
    return null
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Setting up your account...</h2>
          <p className="text-gray-600">Redirecting to complete your profile setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <h1 className="text-lg sm:text-xl font-bold">Chat Rooms</h1>
              <Badge variant="outline" className="text-xs">
                {currentUser.username === "onlynazril7z" ? "CEO" : "User"}
              </Badge>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <span className="text-xs sm:text-sm text-gray-600 hidden sm:block">Welcome, {currentUser.username}</span>
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Available Rooms</h2>
            <p className="text-sm sm:text-base text-gray-600 hidden sm:block">
              Join a conversation or create your own room
            </p>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Room</DialogTitle>
                <DialogDescription>Create a new chat room for others to join</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="roomName">Room Name</Label>
                  <Input
                    id="roomName"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    placeholder="Enter room name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roomDescription">Description (Optional)</Label>
                  <Textarea
                    id="roomDescription"
                    value={roomDescription}
                    onChange={(e) => setRoomDescription(e.target.value)}
                    placeholder="Describe what this room is about"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreating}>
                    {isCreating ? "Creating..." : "Create Room"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms?.map((room) => (
            <Card key={room._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <CardDescription className="mt-1">{room.description || "No description"}</CardDescription>
                  </div>
                  <Badge variant="secondary">
                    <Users className="w-3 h-3 mr-1" />
                    {room.memberCount || 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">Created by {room.ownerUsername}</div>
                  <Link href={`/room/${room._id}`}>
                    <Button size="sm">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Enter Room
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {rooms?.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms yet</h3>
            <p className="text-gray-600 mb-4">Be the first to create a chat room!</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Room
            </Button>
          </div>
        )}
      </main>

      {/* Connection Speed Dialog */}
      <ConnectionSpeedDialog
        isOpen={showSpeedDialog}
        onClose={() => setShowSpeedDialog(false)}
        userId={currentUser._id}
      />
    </div>
  )
}
