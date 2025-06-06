'use client';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SummaryDashboard } from '@/components/dashboard/SummaryDashboard';
import { getDecryptedUserId } from '../../utils/authUtils'
import { useUserCred } from '@/context/usercred';

const Index = () => {
  const navigate = useNavigate();
  const {setuserid}=useUserCred()
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const userId = getDecryptedUserId();

    if (!userId) {
      navigate('/login');
    } else {
      setIsAuthenticated(true);
      setuserid(userId);
    }
  }, [navigate]);

  // Return null until auth check completes (avoids flash)
  if (isAuthenticated === null) return null;

  return <SummaryDashboard />;
};

export default Index;
