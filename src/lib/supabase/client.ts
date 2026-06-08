import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton — module-level caching prevents duplicate GoTrue instances
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

  return client;
}
