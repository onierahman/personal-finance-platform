'use client';

import { Providers } from './providers';

export function ClientProvidersWrapper({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}