import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '管理画面 | 旅のしおり',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">旅のしおり 管理画面</h1>
        <LogoutButton />
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
        (await cookies()).delete('admin_session');
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
