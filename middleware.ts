import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const publicRoutes = ['/', '/auth', '/book-demo', '/pricing'];
  const restaurantSetupRoutes = ['/select-restaurant', '/getting-started'];
  const protectedRoutes = ['/dashboard', '/settings', '/profile'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  if (!isAuthenticated && restaurantSetupRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  if (isAuthenticated && pathname === '/auth') {
    return NextResponse.redirect(new URL('/select-restaurant', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};