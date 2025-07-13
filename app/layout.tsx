import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ClerkProvider } from "@clerk/nextjs"
import { ConvexProvider } from "@/components/convex-provider"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Realtime Chat Rooms",
  description: "Real-time chat application with room management",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/home"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.className} h-svh overflow-hidden`}>
          <ConvexProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </ConvexProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
