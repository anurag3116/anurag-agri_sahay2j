import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
  const url = localStorage.getItem('supabase_url') || import.meta.env.VITE_SUPABASE_URL;
  const key = localStorage.getItem('supabase_anon_key') || import.meta.env.VITE_SUPABASE_ANON_KEY;
  return { url, key };
};

const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseConfig();

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;
