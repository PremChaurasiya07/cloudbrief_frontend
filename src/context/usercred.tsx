import { createContext, useState, ReactNode, useContext } from 'react';

// Define the shape of your context
interface UserCredContextType {
    userdata: string | null;
    setuserdata: (uid: string | null) => void;
}

// Create the context
const UserCred = createContext<UserCredContextType | undefined>(undefined);

// Create a hook for easier access
export const useUserCred = () => {
  const context = useContext(UserCred);
  if (!context) throw new Error('useUserCred must be used within a UserCredProvider');
  return context;
};

// Create the provider component
export const UserCredProvider = ({ children }: { children: ReactNode }) => {
  const [userdata, setuserdata] = useState<string | null>(null);

  return (
    <UserCred.Provider value={{ userdata, setuserdata }}>
      {children}
    </UserCred.Provider>
  );
};
