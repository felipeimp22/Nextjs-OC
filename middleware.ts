import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Force Node.js runtime instead of Edge
export const runtime = 'nodejs';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  // Public routes (anyone can access)
  const publicRoutes = ['/', '/auth', '/book-demo', '/pricing'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Protected routes (require authentication)
  const protectedRoutes = ['/dashboard', '/settings', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Redirect logic
  // 1. Not authenticated + trying to access protected route → redirect to /auth
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  // 2. Authenticated + trying to access auth page → redirect to dashboard
  if (isAuthenticated && pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // 3. Everything else → allow
  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};