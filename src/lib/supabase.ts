

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://imiviisdmfuedejubuqp.supabase.co";
const supabaseKey = `${import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY}`;

export const supabase = createClient(supabaseUrl, supabaseKey);