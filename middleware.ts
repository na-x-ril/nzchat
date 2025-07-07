import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/room(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = auth();

  // Jika user belum login di protected route, redirect ke sign-in
  if (isProtectedRoute(req) && !userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Jika user login di protected route, cek banned
  if (isProtectedRoute(req) && userId) {
    try {
      const banned = await fetchQuery(api.users.isUserBanned, { clerkId: userId });
      if (banned) {
        return NextResponse.redirect(new URL("/banned", req.url));
      }
    } catch (err) {
      console.error("[Middleware Ban Check Error]", err);
      // Optional: Redirect to error page or allow if fetchQuery fails
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
