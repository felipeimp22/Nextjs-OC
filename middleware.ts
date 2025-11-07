import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const publicRoutes = ['/', '/auth', '/book-demo', '/pricing'];
  const isPublicRoute = publicRoutes.includes(pathname);

  const protectedRoutes = ['/dashboard', '/settings', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  if (isAuthenticated && pathname === '/auth') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};