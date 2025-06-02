import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase"; // Adjust the import path as necessary
import CryptoJS from "crypto-js"; // Import crypto-js for encryption and decryption
import { useUserCred } from "@/context/usercred"; // Adjust the import path as necessary
import { set } from "date-fns";
const SECRET_KEY = import.meta.env.VITE_ENCRYPTION_KEY // This key should be stored securely, e.g., in environment variables

const Callback = () => {
  const navigate = useNavigate();
  const {userdata, setuserdata} = useUserCred(); // Assuming you have a context or state management for user data

  // Encrypt and store user_id in sessionStorage
 useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session) {
      const userId = session.user.id;
      setuserdata(session);

      const encryptedUserId = CryptoJS.AES.encrypt(userId, SECRET_KEY).toString();
      sessionStorage.setItem("user_id", encryptedUserId);

      const encryptedStoredUserId = sessionStorage.getItem("user_id");
      if (encryptedStoredUserId) {
        const bytes = CryptoJS.AES.decrypt(encryptedStoredUserId, SECRET_KEY);
        const decryptedUserId = bytes.toString(CryptoJS.enc.Utf8);
        console.log("Decrypted User ID:", decryptedUserId);
      }

      navigate("/");
    }
  });

  return () => {
    listener?.subscription.unsubscribe(); // Cleanup on unmount
  };
}, [navigate]);


  return <p className="text-white text-center mt-10">Signing in...</p>;
};

export default Callback;
