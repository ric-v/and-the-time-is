import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Permanent redirect from legacy Time Was route to Horizon Date Jump entry.
 * Requirement 20.1 — 301 to `/?jump=open`
 */
export function middleware(request: NextRequest) {
  const p = request.nextUrl.pathname;
  if (p === '/TimeWas' || p === '/timewas') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.search = '?jump=open';
    return NextResponse.redirect(url, 301);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/TimeWas', '/timewas'],
};
