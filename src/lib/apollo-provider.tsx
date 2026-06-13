'use client';

import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({ uri: '/api/graphql' });

// URLから /group/[token] のトークンを読み取りヘッダーに付与
const authLink = setContext((_, { headers }) => {
  let groupToken: string | null = null;
  if (typeof window !== 'undefined') {
    const match = window.location.pathname.match(/\/group\/([^/]+)/);
    groupToken = match ? match[1] : null;
  }
  return {
    headers: {
      ...headers,
      ...(groupToken ? { 'x-group-token': groupToken } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export function ApolloWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}
