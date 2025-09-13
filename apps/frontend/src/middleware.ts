import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their allowed roles
const roleRoutes = {
  admin: ['/dashboard'],
  vendor: ['/dashboard/vendor'],
  supplier: ['/dashboard/supplier'],
} as const

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth',
  '/login',
  '/api/auth',
  '/favicon.ico',
  '/_next',
  '/static',
  '/images',
]

// Extract role from JWT token (basic extraction for routing)
function extractRoleFromToken(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role?.toLowerCase() || null
  } catch {
    return null
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Skip middleware for public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next()
  }
  
  // Get authentication token from cookies or headers
  const token = request.cookies.get('access_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')
  
  // If no token, redirect to login
  if (!token) {
    const loginUrl = new URL('/auth?mode=login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Extract user role from token
  const userRole = extractRoleFromToken(token)
  
  if (!userRole) {
    const loginUrl = new URL('/auth?mode=login', request.url)
    return NextResponse.redirect(loginUrl)
  }
  
  // Check if the current path is allowed for the user's role
  const isAllowed = checkPathAccess(pathname, userRole)
  
  if (!isAllowed) {
    // Redirect to appropriate dashboard
    const dashboardUrl = getDashboardUrl(userRole, request.url)
    return NextResponse.redirect(dashboardUrl)
  }
  
  return NextResponse.next()
}

function checkPathAccess(pathname: string, userRole: string): boolean {
  // Admin can access everything
  if (userRole === 'admin') {
    return true
  }
  
  // Check vendor routes
  if (userRole === 'vendor') {
    return pathname.startsWith('/dashboard/vendor') || 
           pathname === '/dashboard' ||
           pathname.startsWith('/dashboard/forecasting') ||
           pathname.startsWith('/dashboard/inventory') ||
           pathname.startsWith('/dashboard/orders')
  }
  
  // Check supplier routes
  if (userRole === 'supplier') {
    return pathname.startsWith('/dashboard/supplier') || 
           pathname === '/dashboard' ||
           pathname.startsWith('/dashboard/subscription-plans')
  }
  
  return false
}

function getDashboardUrl(userRole: string, baseUrl: string): URL {
  switch (userRole) {
    case 'admin':
      return new URL('/dashboard', baseUrl)
    case 'vendor':
      return new URL('/dashboard/vendor', baseUrl)
    case 'supplier':
      return new URL('/dashboard/supplier', baseUrl)
    default:
      return new URL('/auth?mode=login', baseUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 