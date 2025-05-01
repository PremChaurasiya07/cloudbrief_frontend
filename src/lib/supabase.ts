'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://imiviisdmfuedejubuqp.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImltaXZpaXNkbWZ1ZWRlanVidXFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM5MTA4MzEsImV4cCI6MjA1OTQ4NjgzMX0.yUTP_LLD85BpToRKH-6G9bSsLT9F_KwxizKw6UWueTg";

export const supabase = createClient(supabaseUrl, supabaseKey);