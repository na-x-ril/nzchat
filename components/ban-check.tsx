"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Ban, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"

export function BanCheck() {
  const { user, isLoaded } = useUser()
  const router = useRouter()
  const [open, setOpen] = useState(true)

  const currentUser = useQuery(api.users.getCurrentUser, user && isLoaded ? { clerkId: user.id } : "skip")

  useEffect(() => {
    if (isLoaded && user && currentUser === null) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }, [isLoaded, user, currentUser])

  const handleSignOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      router.push("/")
      window.location.reload()
    } catch (error) {
      router.push("/")
      window.location.reload()
    }
  }

  const isBanned = isLoaded && user && currentUser === null

  if (!isBanned) return null

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Ban className="w-6 h-6" />
            Account Banned
          </DialogTitle>
          <DialogDescription asChild className="text-center py-4">
            <div className="flex flex-col items-center gap-4">
              <AlertTriangle className="w-16 h-16 text-red-500" />
              <div className="space-y-2">
                <p className="font-medium">Your account has been banned from this application.</p>
                <p className="text-sm text-gray-600">If you believe this is a mistake, please contact the administrator.</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center">
          <Button onClick={handleSignOut} variant="outline">
            Sign Out
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
