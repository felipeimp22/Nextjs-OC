import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = 'nodejs';

// Map routes to permission fields
const ROUTE_PERMISSIONS: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/menu': 'menuManagement',
  '/orders': 'orders',
  '/kitchen': 'kitchen',
  '/customers': 'customers',
  '/marketing': 'marketing',
  '/analytics': 'analytics',
  '/settings': 'settings',
};

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const publicRoutes = ['/', '/auth', '/book-demo', '/pricing'];
  const protectedRoutes = ['/setup', '/dashboard', '/menu', '/orders', '/kitchen', '/customers', '/marketing', '/analytics', '/settings'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // Redirect unauthenticated users
  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth', req.url));
  }

  // Redirect authenticated users away from auth page
  if (isAuthenticated && pathname === '/auth') {
    return NextResponse.redirect(new URL('/setup', req.url));
  }

  // Check role-based permissions for authenticated users
  if (isAuthenticated && req.auth?.user?.email) {
    const pathParts = pathname.split('/');
    const restaurantId = pathParts[1];
    
    let requiredPermission: string | null = null;
    for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.includes(route)) {
        requiredPermission = permission;
        break;
      }
    }

    if (requiredPermission && restaurantId) {
      try {
        // LAZY LOAD Prisma only when we need it
        const { default: prisma } = await import("@/lib/prisma");
        
        const userRestaurant = await prisma.userRestaurant.findFirst({
          where: {
            restaurantId,
            user: { email: req.auth.user.email }
          },
        });

        if (!userRestaurant) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }

        if (userRestaurant.role === 'owner') {
          return NextResponse.next();
        }

        const rolePermissions = await prisma.rolePermissions.findUnique({
          where: {
            restaurantId_role: {
              restaurantId,
              role: userRestaurant.role,
            },
          },
        });

        if (!rolePermissions) {
          return NextResponse.redirect(new URL(`/${restaurantId}/dashboard`, req.url));
        }

        const hasPermission = rolePermissions[requiredPermission as keyof typeof rolePermissions];

        if (!hasPermission) {
          return NextResponse.redirect(new URL(`/${restaurantId}/dashboard`, req.url));
        }
      } catch (error) {
        console.error('Middleware permission check error:', error);
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};