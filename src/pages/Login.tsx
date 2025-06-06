// import { Auth } from '@supabase/auth-ui-react';
// import { ThemeSupa } from '@supabase/auth-ui-shared';
// import { supabase } from '@/lib/supabase';
// import { useEffect } from 'react';

// const Login = () => (
//   <div className="flex min-h-screen items-center justify-center bg-black">
//     <div className="w-full max-w-md p-6 bg-zinc-900 rounded-2xl shadow-xl border border-zinc-800">
//       <Auth
//         supabaseClient={supabase}
//         appearance={{ theme: ThemeSupa }}
//         theme="dark"
//         providers={['google']}
//         redirectTo={`http://localhost:8080/callback`}
//       />
//     </div>
//   </div>
// );

// export default Login;



import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveEncryptedUserId, getDecryptedUserId } from "../../utils/authUtils"
import { useUserCred } from '@/context/usercred';
const Login = () => {
  const {setuserid}=useUserCred();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const existingUserId = getDecryptedUserId();
      if (existingUserId) return navigate('/');

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        saveEncryptedUserId(session.user.id);
        // console.log("sessionid",session.user.id)
        // setuserid(session.user.id);
        navigate('/');
      } else {
        setLoading(false);
      }
    };
    init();
  }, []);

  return loading ? null : (
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
};

export default Login;
