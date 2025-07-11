import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const isProtectedRoute = createRouteMatcher([
  "/home(.*)",
  "/room(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();

  // Biarkan / publik
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Ban check
  if (isProtectedRoute(req) && userId) {
    try {
      const banned = await fetchQuery(api.users.isUserBanned, { clerkId: userId });
      if (banned) {
        return NextResponse.redirect(new URL("/banned", req.url));
      }
    } catch (err) {
      console.error("[Middleware Ban Check Error]", err);
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};