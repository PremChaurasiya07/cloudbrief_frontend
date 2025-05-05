import { useEffect, useState } from "react";
import { MessageTimeline, Message } from "@/components/messages/MessageTimeline";
import { Mail, Plus } from "lucide-react";
import { supabase } from "@/lib/supabase";

// Email auth info
interface EmailAuthData {
  gmail_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  refresh_expiry: string;
}

// Message structure
interface EmailMessage {
  id: string;
  created_at: string;
  sender: string;
  content: string;
  subject?: string;
  status?: string;
}

const USER_ID = "00000000-0000-0000-0000-000000000001";
const FETCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Gmail = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [emailAccounts, setEmailAccounts] = useState<EmailAuthData[]>([]);
  const [selectedGmailId, setSelectedGmailId] = useState<string | null>(null);

  // Consistent color per email
  const getColorFromEmail = (email: string) => {
    const colors = ["#FF6B6B", "#6BCB77", "#4D96FF", "#F7B801", "#B980F0", "#00C2CB"];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (date: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false
    };
    return new Date(date).toLocaleString("en-GB", options);
  };

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await fetch("http://localhost:3000/api/auth/gmail/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) throw new Error("Failed to refresh access token.");
      const data = await response.json();
      console.log("New access token:", data.accessToken);
      return data.access_token;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return null;
    }
  };

  const fetchMessagesForAccount = async (account: EmailAuthData) => {
    try {
      setIsFetching(true);
      setMessages([]); // Reset messages before fetching
  
      let accessToken = account.access_token;
      const nowUTC = Date.now();
      const expiryUTC = new Date(account.token_expiry).getTime();
  
      // 🔁 Refresh token if expired
      if (expiryUTC <= nowUTC) {
        const newAccessToken = await refreshAccessToken(account.refresh_token);
        if (newAccessToken) {
          // ✅ Update token in Supabase
          await supabase
            .from("email_auth")
            .update({
              access_token: newAccessToken,
              token_expiry: new Date(Date.now() + 3600 * 1000).toISOString(),
            })
            .eq("gmail_id", account.gmail_id);
  
          // ✅ Refetch account from Supabase to get updated access token
          const { data: updatedAccount, error: updateError } = await supabase
            .from("email_auth")
            .select("*")
            .eq("gmail_id", account.gmail_id)
            .single();
  
          if (updateError || !updatedAccount) {
            console.error("Failed to re-fetch updated account from Supabase.");
            setIsFetching(false);
            return;
          }
  
          account = updatedAccount;
          accessToken = updatedAccount.access_token;
        } else {
          console.error(`Could not refresh token for ${account.gmail_id}`);
          setIsFetching(false);
          return;
        }
      }
  
      // 🧠 Check local cache
      const lastFetchKey = `last_fetch_${account.gmail_id}`;
      const lastFetch = localStorage.getItem(lastFetchKey);
      const lastFetchTime = lastFetch ? parseInt(lastFetch, 10) : 0;
  
      if (Date.now() - lastFetchTime > FETCH_CACHE_DURATION) {
        const fetchRes = await fetch("http://localhost:3000/api/auth/gmail/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, user_id: USER_ID }),
        });
  
        if (!fetchRes.ok) throw new Error("Failed to fetch new messages from Gmail");
        localStorage.setItem(lastFetchKey, Date.now().toString());
      }
  
      // 📥 Pull messages from Supabase (your DB)
      const res = await fetch("http://localhost:3000/api/auth/gmail/getmails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmail_id: account.gmail_id,
          user_id: USER_ID,
        }),
      });
  
      if (!res.ok) throw new Error("Failed to fetch synced messages");
  
      const data: EmailMessage[] = await res.json();
      if (!data || data.length === 0) {
        setMessages([]);
        setIsFetching(false);
        return;
      }
  
      const sorted = data.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
  
      const mapped = sorted.map((msg) => ({
        id: msg.id,
        date: formatDate(msg.created_at),
        sender: msg.sender,
        platform: "gmail",
        message: msg.content,
        subject: msg.subject || "No Subject",
        status: msg.status || "new",
      }));
  
      setMessages(mapped);
      setIsFetching(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Failed to fetch messages.");
      setIsFetching(false);
    }
  };
  
  


  useEffect(() => {
    const loadAccounts = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_auth")
        .select("*")
        .eq("user_id", USER_ID);

      if (error || !data) {
        setError("Failed to fetch accounts.");
        setLoading(false);
        return;
      }

      setEmailAccounts(data);
      if (data.length > 0) {
        const first = data[0];
        setSelectedGmailId(first.gmail_id);
        await fetchMessagesForAccount(first);
      }

      setLoading(false);
    };

    loadAccounts();
  }, []);

  const handleLoginRedirect = () => {
    window.location.href = "http://localhost:3000/api/auth/gmail/";
  };

  const handleAvatarClick = async (account: EmailAuthData) => {
    setSelectedGmailId(account.gmail_id);
    await fetchMessagesForAccount(account);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[90vh] bg-transparent">
        <h2 className="text-3xl font-semibold bg-gradient-to-r from-slate-400 via-slate-500 to-slate-400 bg-[length:200%] bg-clip-text text-transparent animate-gradient-x">
          Loading Gmail...
        </h2>
      </div>
    );
  }

  return (
    <div>
      {error && (
        <div className="bg-red-600 text-white p-3 mb-4 rounded">
          <p>{error}</p>
          <button
            className="mt-2 bg-white text-red-600 px-3 py-1 rounded"
            onClick={handleLoginRedirect}
          >
            Login Again
          </button>
        </div>
      )}

      {/* Heading + Avatars */}
      <div className="flex items-center space-x-4 mb-4">
        <h2 className="text-xl font-semibold flex items-center">
          <Mail className="mr-2" /> Gmail
        </h2>
        <div className="flex space-x-2 items-center">
          {emailAccounts.map((account) => (
            <div
              key={account.gmail_id}
              title={account.gmail_id}
              onClick={() => handleAvatarClick(account)}
              className={`w-8 h-8 rounded-full text-white font-semibold flex items-center justify-center cursor-pointer border-2 ${
                selectedGmailId === account.gmail_id
                  ? "border-blue-500"
                  : "border-transparent"
              }`}
              style={{ backgroundColor: getColorFromEmail(account.gmail_id) }}
            >
              {account.gmail_id[0].toUpperCase()}
            </div>
          ))}

          <div
            className="w-8 h-8 rounded-full border-dashed border-2 border-gray-400 flex items-center justify-center cursor-pointer hover:bg-gray-100"
            onClick={handleLoginRedirect}
            title="Connect More"
          >
            <Plus className="text-gray-600" size={16} />
          </div>
        </div>

        {/* 📩 Message Count */}
        <span className="ml-auto text-sm text-gray-600">
          {isFetching ? "Fetching emails..." : `${messages.length} emails`}
        </span>
      </div>

      {/* 📬 Message Timeline or Loader */}
      <div className="relative min-h-[200px]">
        {isFetching ? (
          <div className="flex items-center justify-center h-[500px]">
            <div className="w-20 h-20 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          <MessageTimeline
            messages={messages}
            title="Inbox"
            icon={<Mail size={20} />}
          />
        )}
      </div>
    </div>
  );
};

export default Gmail;
