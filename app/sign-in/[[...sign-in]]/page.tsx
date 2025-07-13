"use client"

import { SignIn } from "@clerk/nextjs"

export default function SignInPage() {
  return (
    <div className="dark:bg-[#090040] lg:dark:bg-[#090030] bg-gray-50 flex items-center justify-center p-4 overflow-hidden fixed inset-0">
      <SignIn
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "shadow-lg",
          },
        }}
        signUpUrl="/sign-up"
      />
    </div>
  )
}
