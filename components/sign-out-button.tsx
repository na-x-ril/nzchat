'use client'

import { useClerk } from '@clerk/nextjs'
import { Button } from "@/components/ui/button"
import type { ButtonHTMLAttributes } from 'react'

interface SignOutButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  redirectUrl?: string
  label?: string
}

export const SignOutButton = ({
  redirectUrl = "/",
  label = "Sign out",
  className,
  ...props
}: SignOutButtonProps) => {
  const { signOut } = useClerk()

  return (
    <Button
      type="button"
      className={className}
      onClick={() => signOut({ redirectUrl })}
      {...props}
    >
      {label}
    </Button>
  )
}