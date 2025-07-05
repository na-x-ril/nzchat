import { SignedIn, SignedOut } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default async function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Chat Rooms</CardTitle>
          <CardDescription>Join real-time conversations with people around the world</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SignedOut>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">Sign in to start chatting</p>
              <Link href="/sign-in">
                <Button className="w-full">Sign in with Google</Button>
              </Link>
            </div>
          </SignedOut>
          <SignedIn>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">Welcome back! Ready to chat?</p>
              <Link href="/dashboard">
                <Button className="w-full">Go to Dashboard</Button>
              </Link>
            </div>
          </SignedIn>
        </CardContent>
      </Card>
    </div>
  )
}
