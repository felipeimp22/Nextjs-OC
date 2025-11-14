import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

// Default permissions based on role
function getDefaultPermissions(role: string) {
  const defaults: Record<string, any> = {
    manager: {
      dashboard: true,
      menuManagement: true,
      orders: true,
      kitchen: true,
      customers: true,
      marketing: true,
      analytics: true,
      settings: true,
    },
    kitchen: {
      dashboard: true,
      menuManagement: false,
      orders: true,
      kitchen: true,
      customers: false,
      marketing: false,
      analytics: false,
      settings: false,
    },
    staff: {
      dashboard: true,
      menuManagement: false,
      orders: true,
      kitchen: false,
      customers: true,
      marketing: false,
      analytics: false,
      settings: false,
    }
  };

  return defaults[role] || {
    dashboard: true,
    menuManagement: false,
    orders: false,
    kitchen: false,
    customers: false,
    marketing: false,
    analytics: false,
    settings: false,
  };
}

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;

  const publicRoutes = ['/', '/auth', '/book-demo', '/pricing'];
  const protectedRoutes = ['/setup', '/dashboard', '/menu', '/orders', '/kitchen', '/customers', '/marketing', '/analytics', '/settings'];

  // Allow all /api/auth routes to pass through
  if (pathname.startsWith('/api/auth') || pathname === '/auth') {
    return NextResponse.next();
  }

  // Allow /auth page for unauthenticated users
  if (pathname === '/auth' && !isAuthenticated) {
    return NextResponse.next();
  }

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
    // Extract restaurantId from pathname (e.g., /690d9babcef39cfddf8aba49/dashboard)
    const pathParts = pathname.split('/');
    const restaurantId = pathParts[1]; // Assuming format: /restaurantId/page

    // Find which permission is needed
    let requiredPermission: string | null = null;
    for (const [route, permission] of Object.entries(ROUTE_PERMISSIONS)) {
      if (pathname.includes(route)) {
        requiredPermission = permission;
        break;
      }
    }

    // If this route requires a permission, check it
    if (requiredPermission && restaurantId) {
      try {
        // Get user's role for this restaurant
        const userRestaurant = await prisma.userRestaurant.findFirst({
          where: {
            restaurantId,
            user: { email: req.auth.user.email }
          },
        });

        if (!userRestaurant) {
          // User doesn't have access to this restaurant
          return NextResponse.redirect(new URL('/setup', req.url));
        }

        // Owner has full access
        if (userRestaurant.role === 'owner') {
          return NextResponse.next();
        }

        // Check role permissions
        const rolePermissions = await prisma.rolePermissions.findUnique({
          where: {
            restaurantId_role: {
              restaurantId,
              role: userRestaurant.role,
            },
          },
        });

        // Get permissions (either from DB or defaults)
        const permissions = rolePermissions
          ? {
              dashboard: rolePermissions.dashboard,
              menuManagement: rolePermissions.menuManagement,
              orders: rolePermissions.orders,
              kitchen: rolePermissions.kitchen,
              customers: rolePermissions.customers,
              marketing: rolePermissions.marketing,
              analytics: rolePermissions.analytics,
              settings: rolePermissions.settings,
            }
          : getDefaultPermissions(userRestaurant.role);

        // Check if user has permission for this page
        const hasPermission = permissions[requiredPermission as keyof typeof permissions];

        if (!hasPermission) {
          // Redirect to dashboard if no permission
          return NextResponse.redirect(new URL(`/${restaurantId}/dashboard`, req.url));
        }
      } catch (error) {
        console.error('Middleware permission check error:', error);
        // On error, allow access but log it
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     */
    '/((?!api/|_next/static|_next/image|favicon.ico|images/).*)',
  ],
};