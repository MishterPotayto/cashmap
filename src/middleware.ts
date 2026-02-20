import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/register", "/api/auth", "/api/stripe/webhook"];
const authRoutes = ["/login", "/register"];
const adviserRoutes = ["/clients", "/mappings", "/organisation"];
const adminRoutes = ["/admin"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;
  const isLoggedIn = !!user;

  // Allow public routes
  if (publicRoutes.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    // Redirect logged-in users away from auth pages
    if (isLoggedIn && authRoutes.some((r) => pathname.startsWith(r))) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // Require auth for everything else
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Check onboarding
  const role = (user as { onboardingCompleted?: boolean; role?: string })?.onboardingCompleted;
  if (
    role === false &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // Admin routes — owner only
  if (adminRoutes.some((r) => pathname.startsWith(r))) {
    const userRole = (user as { role?: string })?.role;
    if (userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Adviser routes — adviser or owner
  if (adviserRoutes.some((r) => pathname.startsWith(r))) {
    const userRole = (user as { role?: string })?.role;
    if (userRole !== "ADVISER" && userRole !== "OWNER") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|splash|sw.js|manifest).*)"],
};
