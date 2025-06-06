import { createContext, useState, ReactNode, useContext, useEffect } from 'react';
import { getDecryptedUserId } from '../../utils/authUtils'; // your secure method

// Define the shape of your context
interface UserCredContextType {
  userdata: string | null;
  setuserdata: (uid: string | null) => void;
  userid: string | null;
  setuserid: (uid: string | null) => void;
}

// Create the context
const UserCred = createContext<UserCredContextType | undefined>(undefined);

// Hook to access the context
export const useUserCred = () => {
  const context = useContext(UserCred);
  if (!context) throw new Error('useUserCred must be used within a UserCredProvider');
  return context;
};

// Provider component
export const UserCredProvider = ({ children }: { children: ReactNode }) => {
  const [userdata, setuserdata] = useState<string | null>(null);
  const [userid, setuserid] = useState<string | null>(null);

  // On app mount, hydrate userid from secure localStorage
  useEffect(() => {
    const storedId = getDecryptedUserId();
    if (storedId) {
      setuserid(storedId);
    }
  }, []);

  return (
    <UserCred.Provider value={{ userdata, setuserdata, userid, setuserid }}>
      {children}
    </UserCred.Provider>
  );
};
