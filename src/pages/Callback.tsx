// import { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import { supabase } from "@/lib/supabase"; // Adjust the import path as necessary
// import CryptoJS from "crypto-js"; // Import crypto-js for encryption and decryption
// import { useUserCred } from "@/context/usercred"; // Adjust the import path as necessary
// import { set } from "date-fns";
// const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY // This key should be stored securely, e.g., in environment variables

// const Callback = () => {
//   const navigate = useNavigate();
//   const {userdata, setuserdata} = useUserCred(); // Assuming you have a context or state management for user data

//   // Encrypt and store user_id in sessionStorage
//  useEffect(() => {
//   const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
//     if (event === "SIGNED_IN" && session) {
//       const userId = session.user.id;
//       setuserdata(session);

//       const encryptedUserId = CryptoJS.AES.encrypt(userId, SECRET_KEY).toString();
//       sessionStorage.setItem("user_id", encryptedUserId);

//       const encryptedStoredUserId = sessionStorage.getItem("user_id");
//       if (encryptedStoredUserId) {
//         const bytes = CryptoJS.AES.decrypt(encryptedStoredUserId, SECRET_KEY);
//         const decryptedUserId = bytes.toString(CryptoJS.enc.Utf8);
//         console.log("Decrypted User ID:", decryptedUserId);
//       }

//       navigate("/");
//     }
//   });

//   return () => {
//     listener?.subscription.unsubscribe(); // Cleanup on unmount
//   };
// }, [navigate]);


//   return <p className="text-white text-center mt-10">Signing in...</p>;
// };

// export default Callback;


import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import CryptoJS from "crypto-js";
import { useUserCred } from "@/context/usercred";

const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY;

const Callback = () => {
  const navigate = useNavigate();
  const { setuserdata } = useUserCred();

  useEffect(() => {
    const processLogin = async () => {
      // Get session from URL fragment
      const { data, error } = await supabase.auth.getSessionFromUrl();

      if (error) {
        console.error("Error getting session:", error.message);
        return;
      }

      if (data?.session) {
        const session = data.session;
        const userId = session.user.id;
        setuserdata(session);

        // Encrypt and store user ID
        const encryptedUserId = CryptoJS.AES.encrypt(userId, SECRET_KEY).toString();
        sessionStorage.setItem("user_id", encryptedUserId);

        // Optional debug
        const encryptedStoredUserId = sessionStorage.getItem("user_id");
        if (encryptedStoredUserId) {
          const bytes = CryptoJS.AES.decrypt(encryptedStoredUserId, SECRET_KEY);
          const decryptedUserId = bytes.toString(CryptoJS.enc.Utf8);
          console.log("Decrypted User ID:", decryptedUserId);
        }

        navigate("/");
      }
    };

    processLogin();
  }, [navigate, setuserdata]);

  return <p className="text-white text-center mt-10">Signing in...</p>;
};

export default Callback;
