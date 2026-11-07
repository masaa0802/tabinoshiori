/**
 * /admin 配下のログイン確認（Next.js 16 の proxy。旧 middleware）。
 *
 * 以前はリポジトリ直下の middleware.ts に置いていたが、src/app を使う構成では
 * src/ の中に置かないと Next.js に読まれず、確認が一度も動いていなかった。
 * 各ページ・API でも isAdminSession() で確かめているので、これは入口での二重チェック。
 */
import { NextRequest, NextResponse } from 'next/server';

export function proxy(req: NextRequest) {
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
