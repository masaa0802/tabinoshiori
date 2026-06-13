"use client";

// Apollo は layout.tsx の ApolloWrapper で提供済み
// 将来的に認証プロバイダなどをここに追加する
export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
