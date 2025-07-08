"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";

export default function SplashPage() {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center text-center bg-gradient-to-br from-blue-100 to-indigo-300 fixed inset-0 overflow-hidden">
      <Sparkles className="w-16 h-16 text-indigo-600 mb-4 animate-pulse" />
      <h1 className="text-3xl font-bold mb-2">Welcome to NZChat 🚀</h1>
      <p className="text-gray-600 mb-6 max-w-md">
        A clean, modern, and fast collaborative chat app built with Next.js, Clerk, Convex, and Tailwind CSS.
      </p>
      <div className="flex gap-4 flex-wrap justify-center">
        <Link href="/home">
          <Button className="flex bg-white gap-2 text-gray-900 hover:bg-indigo-600 hover:text-white transition-colors">
            <h1>Get Started</h1>
            <ArrowUpRight className="h-20 w-20" />
          </Button>
        </Link>
      </div>
    </div>
  );
}