import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdminSession } from '@/lib/admin/session';

export const metadata: Metadata = {
  title: '管理画面 | 旅のしおり',
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // ダッシュボード（/admin）はクライアント側でデータを読むページなので、
  // ここで止めないとログインなしでも画面の枠だけは開けてしまう
  if (!(await isAdminSession())) redirect('/admin/login');

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">旅のしおり 管理画面</h1>
        <div className="flex items-center gap-5">
          <a href="/admin/blog-stats" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            記事のビュー数
          </a>
          <a href="/admin/polls" className="text-sm text-gray-500 hover:text-gray-800 transition-colors">
            読者アンケート
          </a>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        'use server';
        const { cookies } = await import('next/headers');
        const { redirect } = await import('next/navigation');
        (await cookies()).delete('admin_session');
        redirect('/admin/login');
      }}
    >
      <button
        type="submit"
        className="text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        ログアウト
      </button>
    </form>
  );
}
