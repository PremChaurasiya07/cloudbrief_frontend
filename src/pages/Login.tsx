import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

const Login = () => (
  <div className="flex min-h-screen items-center justify-center bg-black">
    <div className="w-full max-w-md p-6 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800">
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="dark"
        providers={['google']}
        redirectTo={`http://localhost:8080/callback`}
      />
    </div>
  </div>
);

export default Login;
