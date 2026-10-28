import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { SESSION_COOKIE_NAME, decodeSession, formatSessionUserTag } from '@/lib/auth/session';

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const fullPath = search ? `${pathname}${search}` : pathname;

  const cookie = request.cookies.get(SESSION_COOKIE_NAME);
  const session = cookie?.value ? await decodeSession(cookie.value) : null;
  const isAuthenticated = !!session;

  const isLoginPage = pathname.startsWith('/login');
  const isProtectedRoute =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/settings');

  const isAdminOnlyRoute = pathname.startsWith('/admin') || pathname.startsWith('/settings');

  // 1. Redirect unauthenticated users trying to access protected routes to /login
  if (!isAuthenticated && isProtectedRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    console.log(
      `[proxy] ${request.method} ${fullPath} - unauthenticated -> REDIRECT ${loginUrl.pathname}${loginUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  const userTag = formatSessionUserTag(session);
  const defaultRoute = '/dashboard';

  // 2. Redirect authenticated users away from /login to their default route
  if (isAuthenticated && isLoginPage) {
    console.log(
      `[proxy] ${request.method} ${fullPath} - ${userTag} -> REDIRECT ${defaultRoute} (already authenticated)`
    );
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  // 3. Restrict admin routes to admin role
  if (isAuthenticated && isAdminOnlyRoute && session.role !== 'admin') {
    console.log(
      `[proxy] ${request.method} ${fullPath} - ${userTag} -> REDIRECT ${defaultRoute} (requires admin role)`
    );
    return NextResponse.redirect(new URL(defaultRoute, request.url));
  }

  console.log(`[proxy] ${request.method} ${fullPath} - ${userTag} -> ALLOW`);
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/settings/:path*', '/login'],
};
