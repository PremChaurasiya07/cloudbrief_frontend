

'use client';

import { CollapsibleSummary } from './CollapsibleSummary';
import { ChatInterface } from '../chat/ChatInterface';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';  // React Router DOM
import { getDecryptedUserId, clearUserData } from '../../../utils/authUtils'; // adjust path

export function SummaryDashboard() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check user on mount
    const userId = getDecryptedUserId();

    if (!userId) {
      // No valid user found — logout and redirect
      clearUserData();
      navigate('/login');
      return;
    }

    // Optional: set interval to check expiry every minute
    const interval = setInterval(() => {
      const uid = getDecryptedUserId();
      if (!uid) {
        clearUserData();
        navigate('/login');
      }
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="space-y-6 h-full relative">
      <div>
        <h1 className="text-2xl font-bold mb-1">Daily Brief</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Here's your AI-generated summary for what's important today
        </p>
      </div>

      <div className="relative z-10">
        <CollapsibleSummary />
      </div>

      <div className="flex flex-col h-[calc(100vh-20rem)]">
        <ChatInterface />
      </div>
    </div>
  );
}
