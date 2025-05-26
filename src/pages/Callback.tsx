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
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("Session data:", data); // Log session data for debugging
      setuserdata(data); // Set user ID in context or state
      if (error) {
        console.error("Error fetching session:", error.message);
      } else {
        const userId = data.session.user.id;
        console.log("Session id:", userId);
        
        // Encrypt the user_id before storing it in sessionStorage
        const encryptedUserId = CryptoJS.AES.encrypt(userId, SECRET_KEY).toString();
        sessionStorage.setItem('user_id', encryptedUserId);

        // Decrypt the user_id when retrieved from sessionStorage
        const encryptedStoredUserId = sessionStorage.getItem('user_id');
        if (encryptedStoredUserId) {
          const bytes = CryptoJS.AES.decrypt(encryptedStoredUserId, SECRET_KEY);
          const decryptedUserId = bytes.toString(CryptoJS.enc.Utf8); // Decrypt the user_id
          console.log("Decrypted User ID:", decryptedUserId); // Log decrypted user ID
        } else {
          console.error("No user_id found in sessionStorage.");
        }

        // Redirect after successful login
        navigate("/");  // Redirect to home or any other page after successful login
      }
    };

    checkSession();
  }, [navigate]);

  return <p className="text-white text-center mt-10">Signing in...</p>;
};

export default Callback;
