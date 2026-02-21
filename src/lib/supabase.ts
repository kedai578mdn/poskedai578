import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (!supabaseUrl || !supabaseKey || supabaseUrl === 'undefined' || supabaseKey === 'undefined' || supabaseUrl === 'null' || supabaseKey === 'null') {
    throw new Error('Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables.');
  }

  try {
    // Basic validation to ensure it starts with http/https
    if (!supabaseUrl.toLowerCase().startsWith('http')) {
      let hint = '';
      if (supabaseUrl.startsWith('eyJ')) {
        hint = ' It looks like you might have pasted your API Key (Anon Key) into the VITE_SUPABASE_URL field by mistake.';
      }
      throw new Error(`URL must start with http:// or https:// (Received: "${supabaseUrl}").${hint}`);
    }
    new URL(supabaseUrl);
  } catch (e) {
    const detail = (e as Error).message;
    throw new Error(`Invalid VITE_SUPABASE_URL: "${supabaseUrl}". ${detail}. Please check your environment variables.`);
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};
