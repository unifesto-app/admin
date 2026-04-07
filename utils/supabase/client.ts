import { createBrowserClient } from '@supabase/ssr';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://db.unifesto.app';
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? 'sb_publishable_cPr8iHniQZXIqwyikzpuDg_mgB3g3Ze';

export const createClient = () =>
  createBrowserClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
  );
