"use client";

import { SignOutButton } from "@/components/sign-out-button";
import { AlertTriangle, MessageCircleIcon } from "lucide-react";

export default function BannedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">Account Banned</h1>
      <p className="text-gray-600 mb-4">Your account has been banned. If you believe this is a mistake, contact support.</p>
      <SignOutButton className="font-semibold rounded-lg"/>
    </div>
  );
}