import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /admin/login は認証不要
  if (pathname === '/admin/login') {
    return NextResponse.next();
  }

  // /admin/* は全てセッション検証
  if (pathname.startsWith('/admin')) {
    const session = req.cookies.get('admin_session');
    const validToken = process.env.ADMIN_SESSION_TOKEN;

    if (!session || !validToken || session.value !== validToken) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = '/admin/login';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
