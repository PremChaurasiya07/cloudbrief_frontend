import { useEffect, useState } from "react";
import { MessageTimeline, Message } from "@/components/messages/MessageTimeline";
import {
  Mail,
  Plus,
  Inbox,
  Star,
  FileText,
  Send,
  Archive,
  Users,
  Tag,
  Menu, // For hamburger icon
  Edit, // For compose button
  X, // For close icon in mobile sidebar
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext"; // Import useTheme
import ComposeEmailModal from "@/components/mail/ComposeEmailModal"; // Import the modal component

interface EmailAuthData {
  gmail_id: string;
  access_token: string;
  refresh_token: string;
  token_expiry: string;
  refresh_expiry: string; // Assuming this field exists based on your interface
}

interface EmailMessage extends Message {
  created_at: string; // Property from fetched email data (used in fetchMessagesForAccount)
  // 'content' is used in fetchMessagesForAccount, maps to 'message' in Message interface
  // 'body' is used in Drafts, maps to 'message' in Message interface
  // 'createdAt' is used in Drafts (from your JSON sample), maps to 'date' in Message interface
}

// const userid="00000000-0000-0000-0000-000000000001"; // Using USER_ID constant
type MessageCategory =
  | "INBOX"
  | "STARRED"
  | "DRAFT"
  | "SENT"
  | "ALL_MAIL"
  | "SOCIAL"
  | "PROMOTIONS";

const USER_ID = "00000000-0000-0000-0000-000000000001";
const FETCH_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const Gmail = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [emailAccounts, setEmailAccounts] = useState<EmailAuthData[]>([]);
  const [selectedGmailId, setSelectedGmailId] = useState<string | null>(null);
  const [cred_data, setcred_data] = useState<EmailAuthData | null>(null);
  const [selectedCategory, setSelectedCategory] =
    useState<MessageCategory>("INBOX");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [open, setOpen] = useState(false); // For ComposeEmailModal

  const { theme } = useTheme(); // Use the theme hook

  const categories = [
    { name: "Inbox", icon: Inbox, id: "INBOX" as MessageCategory },
    { name: "Starred", icon: Star, id: "STARRED" as MessageCategory },
    { name: "Drafts", icon: FileText, id: "DRAFT" as MessageCategory },
    { name: "Sent", icon: Send, id: "SENT" as MessageCategory },
    { name: "All Mail", icon: Archive, id: "ALL_MAIL" as MessageCategory },
    { name: "Social", icon: Users, id: "SOCIAL" as MessageCategory },
    { name: "Promotions", icon: Tag, id: "PROMOTIONS" as MessageCategory },
  ];

  const currentCategory =
    categories.find((cat) => cat.id === selectedCategory) || categories[0];

  const getColorFromEmail = (email: string) => {
    const colors = [
      "#FF6B6B",
      "#6BCB77",
      "#4D96FF",
      "#F7B801",
      "#B980F0",
      "#00C2CB",
    ];
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = email.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (date: string) => {
    const isMobileView = typeof window !== "undefined" && window.innerWidth < 768;

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    };

    try {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
            console.warn("Invalid date passed to formatDate:", date);
            return "Invalid Date";
        }
        const datePart = d.toLocaleString("en-GB", dateOptions);
        const timePart = d.toLocaleString("en-GB", timeOptions);
        return isMobileView ? `${datePart}\n${timePart}` : `${datePart} ${timePart}`;
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return "Invalid Date";
    }
  };

  const Drafts = async () => {
  if (!cred_data || !cred_data.refresh_token) {
    setError("Authentication data is not available to fetch drafts. Please select an account.");
    setMessages([]);
    setIsFetching(false);
    return;
  }

  // Clear previous messages to show the main loading spinner for drafts
  setMessages([]); // <--- ADD THIS LINE
  setIsFetching(true);
  setError(null);

  try {
    const response = await fetch("http://localhost:3000/api/auth/gmail/fetchdraft", {
      method: 'POST',
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        refreshToken: cred_data.refresh_token,
        userId: USER_ID
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      setError(`Failed to fetch drafts: ${response.status} - ${errorText || "Server error"}. Please try again later.`);
      // setMessages([]); // Already cleared at the start
      return;
    }

    const responseData = await response.json();
    console.log("draft data", responseData);

    const draftsArray = responseData.drafts;

    if (!draftsArray || draftsArray.length === 0) {
      // setMessages([]); // Already cleared if we reach here and it's empty
      return;
    }

    const sorted = draftsArray.sort(
      (a: any, b: any) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const mapped: Message[] = sorted.map((msg: any) => ({
      id: msg.id,
      date: formatDate(msg.createdAt),
      sender: selectedGmailId || cred_data.gmail_id,
      platform: "gmail",
      subject: msg.subject || "No Subject",
      message: msg.body,
      status: "draft",
      chat_id: msg.id,
    }));

    setMessages(mapped);
  } catch (err: any) {
    console.error("Fetch error in Drafts:", err);
    setError(`Failed to fetch draft messages: ${err.message || "Unknown error"}.`);
    // setMessages([]); // Already cleared at the start, or if an error occurs before setting new messages
  } finally {
    setIsFetching(false);
  }
};

  const refreshAccessToken = async (refreshToken: string) => {
    try {
      const response = await fetch(
        "http://localhost:3000/api/auth/gmail/refresh",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        }
      );

      if (!response.ok) {
         console.error("Failed to refresh access token. Status:", response.status);
         const errorBody = await response.text();
         console.error("Error body:", errorBody);
         throw new Error(`Failed to refresh access token. Status: ${response.status}`);
      }
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error("Error refreshing access token:", error);
      return null;
    }
  };

  const fetchMessagesForAccount = async (account: EmailAuthData) => {
    if (!account || !account.gmail_id) {
        setError("No account selected or account data is missing.");
        setMessages([]);
        setIsFetching(false);
        return;
    }
    setIsFetching(true);
    setError(null);
    setMessages([]); // Clear messages for the new account/category fetch

    try {
      let currentAccount = { ...account }; // Make a mutable copy
      let accessToken = currentAccount.access_token;
      const nowUTC = Date.now();
      const expiryUTC = new Date(currentAccount.token_expiry).getTime();

      if (expiryUTC <= nowUTC) {
        console.log(`Token expired for ${currentAccount.gmail_id}, refreshing...`);
        const newAccessToken = await refreshAccessToken(currentAccount.refresh_token);
        if (newAccessToken) {
          const newExpiry = new Date(Date.now() + 3500 * 1000).toISOString(); // 3500 seconds for safety
          await supabase
            .from("email_auth")
            .update({
              access_token: newAccessToken,
              token_expiry: newExpiry,
            })
            .eq("gmail_id", currentAccount.gmail_id)
            .eq("user_id", USER_ID); // Important: ensure USER_ID is part of the condition

          // Update local state immediately for current operation
          currentAccount.access_token = newAccessToken;
          currentAccount.token_expiry = newExpiry;
          accessToken = newAccessToken;

          // Update the main emailAccounts state and cred_data if it matches
          setEmailAccounts(prevAccounts => prevAccounts.map(acc =>
            acc.gmail_id === currentAccount.gmail_id ? { ...acc, access_token: newAccessToken, token_expiry: newExpiry } : acc
          ));
          if (cred_data && cred_data.gmail_id === currentAccount.gmail_id) {
            setcred_data(currentAccount);
          }
          console.log(`Token refreshed and updated for ${currentAccount.gmail_id}`);
        } else {
          console.error(`Could not refresh token for ${currentAccount.gmail_id}`);
          setError(`Could not refresh Gmail access for ${currentAccount.gmail_id}. Please re-authenticate.`);
          setIsFetching(false);
          return;
        }
      }

      

      const lastFetchKey = `last_fetch_${currentAccount.gmail_id}_${selectedCategory}`; // Add category to cache key
      const lastFetch = localStorage.getItem(lastFetchKey);
      const lastFetchTime = lastFetch ? parseInt(lastFetch, 10) : 0;

      // Only fetch from Gmail API if cache is stale
      if (Date.now() - lastFetchTime > FETCH_CACHE_DURATION) {
        console.log(`Fetching new messages from Gmail API for ${currentAccount.gmail_id}`);
        const fetchRes = await fetch(
          "http://localhost:3000/api/auth/gmail/fetch",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken,
              user_id: USER_ID,
              gmail_id: currentAccount.gmail_id,
              // You might want to pass 'selectedCategory' here if your /fetch API supports it
            }),
          }
        );

        if (!fetchRes.ok) {
          const errorText = await fetchRes.text();
          throw new Error(`Failed to fetch new messages from Gmail: ${fetchRes.status} - ${errorText}`);
        }
        localStorage.setItem(lastFetchKey, Date.now().toString());
        console.log(`Successfully fetched new messages from Gmail API for ${currentAccount.gmail_id}`);
      } else {
        console.log(`Using cached messages for ${currentAccount.gmail_id}, category ${selectedCategory}`);
      }
      
      // Fetch messages from your backend (which should now have the latest from Gmail)
      console.log(`Getting messages from backend for ${currentAccount.gmail_id}, category ${selectedCategory}`);
      const res = await fetch("http://localhost:3000/api/auth/gmail/getmails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmail_id: currentAccount.gmail_id,
          user_id: USER_ID,
          category: selectedCategory, // Send category to backend
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch synced messages from backend: ${res.status} - ${errorText}`);
      }

      const data: EmailMessage[] = await res.json();
      if (!data || data.length === 0) {
        setMessages([]);
        // setError(`No messages found for ${selectedCategory}.`); // Optional: inform user
        setIsFetching(false);
        return;
      }

      const sorted = data.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const mapped: Message[] = sorted.map((msg) => ({
        id: msg.id,
        date: formatDate(msg.created_at),
        sender: msg.sender,
        platform: "gmail",
        subject: msg.subject || "No Subject",
        message: (msg as any).content || (msg as any).body || "", // Handle both 'content' and 'body'
        status: msg.status || "new",
        chat_id: msg.chat_id,
        starred: msg.starred, // Assuming 'starred' is a property in your EmailMessage
      }));

      setMessages(mapped);
    } catch (err: any) {
      console.error("Fetch error in fetchMessagesForAccount:", err);
      setError(`Failed to fetch messages: ${err.message || "Unknown error"}.`);
      setMessages([]); // Ensure messages are cleared on error
    } finally {
      setIsFetching(false);
    }
  };

  const fetchstarred = async (account: EmailAuthData) => {
    if (!account || !account.gmail_id) {
        setError("No account selected or account data is missing.");
        setMessages([]);
        setIsFetching(false);
        return;
    }
    setIsFetching(true);
    setError(null);
    setMessages([]); // Clear messages for the new account/category fetch

    try {
      let currentAccount = { ...account }; // Make a mutable copy
      let accessToken = currentAccount.access_token;
      const nowUTC = Date.now();
      const expiryUTC = new Date(currentAccount.token_expiry).getTime();

      if (expiryUTC <= nowUTC) {
        console.log(`Token expired for ${currentAccount.gmail_id}, refreshing...`);
        const newAccessToken = await refreshAccessToken(currentAccount.refresh_token);
        if (newAccessToken) {
          const newExpiry = new Date(Date.now() + 3500 * 1000).toISOString(); // 3500 seconds for safety
          await supabase
            .from("email_auth")
            .update({
              access_token: newAccessToken,
              token_expiry: newExpiry,
            })
            .eq("gmail_id", currentAccount.gmail_id)
            .eq("user_id", USER_ID); // Important: ensure USER_ID is part of the condition

          // Update local state immediately for current operation
          currentAccount.access_token = newAccessToken;
          currentAccount.token_expiry = newExpiry;
          accessToken = newAccessToken;

          // Update the main emailAccounts state and cred_data if it matches
          setEmailAccounts(prevAccounts => prevAccounts.map(acc =>
            acc.gmail_id === currentAccount.gmail_id ? { ...acc, access_token: newAccessToken, token_expiry: newExpiry } : acc
          ));
          if (cred_data && cred_data.gmail_id === currentAccount.gmail_id) {
            setcred_data(currentAccount);
          }
          console.log(`Token refreshed and updated for ${currentAccount.gmail_id}`);
        } else {
          console.error(`Could not refresh token for ${currentAccount.gmail_id}`);
          setError(`Could not refresh Gmail access for ${currentAccount.gmail_id}. Please re-authenticate.`);
          setIsFetching(false);
          return;
        }
      }

      const { data: mails, error } = await supabase
            .from('memory_entries')
            .select('id,sender, content, created_at, metadata,chat_id,starred')
            .eq('user_id', USER_ID)
            .eq('receiver', selectedGmailId)
            .eq('type', 'email')
            .eq('starred',"yes");

      if (error) {
        console.log("Error fetching starred messages:", error);
      }

      if (!mails || mails.length === 0) {
        setMessages([]);
        // setError(`No messages found for ${selectedCategory}.`); // Optional: inform user
        setIsFetching(false);
        return;
      }

      const sorted = mails.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      const mapped: Message[] = sorted.map((msg) => ({
        id: msg.id,
        date: formatDate(msg.created_at),
        sender: msg.sender,
        platform: "gmail",
        subject: msg.metadata.subject || "No Subject",
        message: (msg as any).content || (msg as any).body || "", // Handle both 'content' and 'body'
        status: msg.metadata.status || "new",
        chat_id: msg.chat_id,
        starred: msg.starred, // Assuming 'starred' is a property in your EmailMessage
      }));

      setMessages(mapped);
    } catch (err: any) {
      console.error("Fetch error in fetchMessagesForAccount:", err);
      setError(`Failed to fetch messages: ${err.message || "Unknown error"}.`);
      setMessages([]); // Ensure messages are cleared on error
    } finally {
      setIsFetching(false);
    }
  };

 

  useEffect(() => {
    
    const loadAccountsAndInitialMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from("email_auth")
          .select("*")
          .eq("user_id", USER_ID);

        if (fetchError || !data) {
          setError("Failed to fetch accounts. " + (fetchError?.message || ""));
          setLoading(false);
          return;
        }

        setEmailAccounts(data as EmailAuthData[]);
        if (data.length > 0) {
          const firstAccount = data[0] as EmailAuthData;
          setSelectedGmailId(firstAccount.gmail_id);
          localStorage.setItem("selected_gmail_id", selectedGmailId);
          setcred_data(firstAccount);
          // Initial fetch will be triggered by the useEffect below for selectedGmailId
        } else {
          setError("No Gmail accounts connected. Please connect one.");
          setMessages([]); // No accounts, so no messages
        }
      } catch (err: any) {
        console.error("Initial load error:", err);
        setError(`Failed during initial setup: ${err.message || "Unknown error"}.`);
      } finally {
        setLoading(false);
      }
    };

    loadAccountsAndInitialMessages();
  }, []); // Empty dependency array: runs once on mount

  useEffect(() => {
    // This effect handles fetching when selectedGmailId or selectedCategory changes,
    // but only for categories other than DRAFT (which has its own fetch logic).
    if (selectedGmailId && cred_data) {
    if (selectedCategory === "STARRED" && cred_data) {
      fetchstarred(cred_data);

    }
     else if (selectedCategory !== "DRAFT") {
        fetchMessagesForAccount(cred_data);
      }
      // If selectedCategory is DRAFT, it's handled by handleCategoryChange calling Drafts()
    }
  }, [selectedGmailId, selectedCategory, cred_data]); // Re-fetch if account, category or cred_data changes

  const handleLoginRedirect = () => {
    window.location.href = "http://localhost:3000/api/auth/gmail/";
  };

  const handleAvatarClick = async (account: EmailAuthData) => {
     
    setSelectedGmailId(account.gmail_id);
    localStorage.setItem("selected_gmail_id", selectedGmailId);
    setcred_data(account); // Update cred_data to the selected account
    setSelectedCategory("INBOX"); // Default to INBOX, useEffect will trigger fetch
    // setMessages([]); // Clear messages immediately for responsiveness
  };

  const handleCategoryChange = async (category: MessageCategory) => {
    setSelectedCategory(category); // This will trigger the useEffect above for non-draft categories
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }

    // setMessages([]); // Optional: clear messages immediately

    if (category === "DRAFT") {
      await Drafts(); // Drafts has its own logic and uses cred_data
    }
    // For other categories, the useEffect listening to selectedCategory and cred_data will handle fetching.
  };

  // Dynamic theme classes
  const mainBgClass = `bg-background ${theme === 'dark' ? 'text-foreground' : 'text-foreground'}`;
  const cardBgClass = `bg-card`;
  const textColorClass = `text-card-foreground`;
  const subTextColorClass = `text-muted-foreground`;
  const borderColorClass = `border-border`;
  const hoverBgClass = `hover:bg-accent`;
  const selectedBgClass = `bg-primary/20 text-primary-foreground`;

  if (loading) {
    return (
      <div
        className={`fixed inset-0 flex items-center justify-center ${mainBgClass} transition-colors duration-500 z-50`}
      >
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-28 mb-8">
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-blue-500 rounded-full animate-spin-slow"></div>
            <div className="absolute inset-4 border-4 border-transparent border-b-green-500 border-l-green-500 rounded-full animate-spin-fast animation-delay-200"></div>
            <Mail
              className="absolute inset-0 m-auto w-16 h-16 text-blue-400 opacity-80 animate-pulse-fade"
              strokeWidth={1.5}
            />
          </div>
          <h2
            className={`text-4xl font-extrabold bg-gradient-to-r from-blue-400 via-green-400 to-teal-400 bg-[length:300%] bg-clip-text text-transparent animate-gradient-x`}
          >
            Loading Gmail...
          </h2>
          <p className={`${subTextColorClass} mt-3 text-lg`}>
            Securing and syncing your messages. Please wait.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col md:flex-row w-full h-full ${mainBgClass} overflow-hidden rounded-lg md:rounded-xl`}
    >
      {open && selectedGmailId && cred_data && <ComposeEmailModal onClose={() => setOpen(false)} fromEmail={selectedGmailId} userId={USER_ID} />}
      {/* Mobile Hamburger Menu / Close Button */}
      <div className={`md:hidden p-3 flex justify-between items-center ${cardBgClass} shadow-lg flex-shrink-0`}>
        <h2 className={`text-lg font-semibold flex items-center ${textColorClass}`}>
          <Mail className="mr-2 h-5 w-5" />
          Gmail
        </h2>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`p-2 rounded-md ${hoverBgClass} ${textColorClass} focus:outline-none focus:ring-2 focus:ring-ring`}
          aria-label="Toggle categories"
        >
          {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Sidebar for Categories (Collapsible on Mobile) */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-48 sm:w-56 ${cardBgClass} p-3 sm:p-4 shadow-lg flex-shrink-0 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${textColorClass} flex flex-col`}
      >
        <div className="md:hidden flex justify-end mb-3 sm:mb-4">
          <button
            onClick={() => setIsSidebarOpen(false)}
            className={`p-2 rounded-md ${hoverBgClass} ${textColorClass} focus:outline-none focus:ring-2 focus:ring-ring`}
            aria-label="Close categories"
          >
            <X size={20} />
          </button>
        </div>
        <h3 className={`text-base sm:text-lg font-bold mb-3 sm:mb-4 flex items-center ${textColorClass}`}>
          <Mail className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Categories
        </h3>
        <nav className="space-y-1 sm:space-y-2 flex-grow overflow-y-auto custom-scrollbar">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryChange(category.id)}
              className={`
                w-full flex items-center px-2 py-1.5 rounded-md text-xs sm:text-sm transition-colors duration-200
                ${
                  selectedCategory === category.id
                    ? `${selectedBgClass} font-semibold`
                    : `${textColorClass} ${hoverBgClass}`
                }
              `}
            >
              <category.icon size={16} className="mr-2 sm:mr-3" />
              {category.name}
            </button>
          ))}
        </nav>

        <div className="mt-4 sm:mt-6 flex-shrink-0 hidden md:block">
          <button
            onClick={() => {
              if (selectedGmailId && cred_data) {
                setOpen(true);
              } else {
                setError("Please select an email account to compose a message.");
              }
            }}
            className={`w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-200
              bg-primary text-primary-foreground hover:bg-primary/90
            `}
            disabled={!selectedGmailId || !cred_data} // Disable if no account selected
          >
            <Edit size={18} className="mr-2" /> Compose
          </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 p-3 sm:p-4 shadow-lg rounded-lg flex flex-col ${cardBgClass} ${textColorClass} min-w-0`}
      >
        {error && (
          <div className="bg-destructive text-destructive-foreground p-3 mb-3 rounded text-sm flex-shrink-0 flex justify-between items-center">
            <p>{error}</p>
            {error.includes("re-authenticate") && (
                 <button
                 className="ml-2 bg-destructive-foreground text-destructive px-2 py-0.5 rounded text-xs"
                 onClick={handleLoginRedirect}
               >
                 Login Again
               </button>
            )}
            <button onClick={() => setError(null)} className="ml-2 text-lg leading-none">&times;</button>
          </div>
        )}

        {/* Header Section: Category Name + Avatars */}
        <div className={`flex items-center space-x-2 sm:space-x-4 mb-3 sm:mb-4 flex-shrink-0 min-w-0 ${textColorClass}`}>
          <h2 className="text-base sm:text-xl font-semibold flex items-center flex-shrink-0">
            <currentCategory.icon className="mr-1.5 sm:mr-2 h-5 w-5 sm:h-6 sm:w-6" />{" "}
            <span className="hidden sm:inline">{currentCategory.name}</span>
            <span className="sm:hidden">{currentCategory.name.split(' ')[0]}</span>
          </h2>
          <div className="flex space-x-1 sm:space-x-2 items-center overflow-x-auto pb-1.5 flex-nowrap custom-scrollbar flex-1 min-w-0">
            {emailAccounts.map((account) => (
              <div
                key={account.gmail_id}
                title={account.gmail_id}
                onClick={() => handleAvatarClick(account)}
                className={`w-6 h-6 ml-[1vw] mt-[1vh]  sm:w-8 sm:h-8 rounded-full text-white font-semibold flex items-center justify-center cursor-pointer border-2 flex-shrink-0 text-sm sm:text-base ${
                  selectedGmailId === account.gmail_id
                    ? "border-teal-400 ring-2 ring-teal-300" // Enhanced selected style
                    : borderColorClass
                }`}
                style={{ backgroundColor: getColorFromEmail(account.gmail_id) }}
              >
                {account.gmail_id[0].toUpperCase()}
              </div>
            ))}
            <div
              className={`w-7 h-7 sm:w-8 mt-[1vh] sm:h-8 rounded-full border-dashed border-2 ${borderColorClass} flex items-center justify-center cursor-pointer ${hoverBgClass} flex-shrink-0`}
              onClick={handleLoginRedirect}
              title="Connect More Accounts"
            >
              <Plus className={`${subTextColorClass}`} size={14} />
            </div>
          </div>
          <span className={`ml-auto text-xs sm:text-sm ${subTextColorClass} flex-shrink-0`}>
            {isFetching ? "Fetching..." : `${messages.length} email${messages.length !== 1 ? 's' : ''}`}
          </span>
        </div>

        {/* Message List Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {isFetching && messages.length === 0 ? ( // Show full pane loader only if no messages are currently shown
            <div className={`absolute inset-0 flex items-center justify-center ${cardBgClass} bg-opacity-75 rounded-lg z-10`}>
              <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                <div className="absolute inset-0 border-3 sm:border-4 border-transparent border-t-blue-500 border-r-green-500 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-1.5 sm:inset-2 border-3 sm:border-4 border-transparent border-b-purple-500 border-l-yellow-500 rounded-full animate-spin-fast animation-delay-200"></div>
                <div className="absolute inset-3 sm:inset-4 border-3 sm:border-4 border-transparent border-t-teal-500 border-r-orange-500 rounded-full animate-spin-slow animation-delay-400"></div>
                <Mail
                  size={40}
                  className="absolute inset-0 m-auto text-blue-400 opacity-80 animate-pulse"
                />
              </div>
            </div>
          ) : !isFetching && messages.length === 0 && !error ? (
            <div className={`flex items-center justify-center h-full ${subTextColorClass} text-sm sm:text-base`}>
              <p>No messages found for {currentCategory.name} in {selectedGmailId ? selectedGmailId.split('@')[0] : 'this account'}.</p>
            </div>
          ) : messages.length > 0 ? ( // Only render MessageTimeline if there are messages
            <MessageTimeline
              selected_gmail={selectedGmailId}
              messages={messages}
              category={selectedCategory}
              cred_data={cred_data}
              title={selectedCategory} // Or currentCategory.name
              icon={<currentCategory.icon size={20} />}
              fecthmessagesForAccount={cred_data ? () => fetchMessagesForAccount(cred_data) : undefined}
              fetchdraft={() => Drafts()}
              fetchstarred={() => fetchstarred(cred_data)}
            />
          ) : null /* Potentially show error specific message here if !isFetching && messages.length === 0 && error exists */}
        </div>
      </div>

      {/* Mobile Compose Button */}
      <button
        onClick={() => {
            if (selectedGmailId && cred_data) {
              setOpen(true);
            } else {
              setError("Please select an email account to compose a message.");
            }
          }}
        className={`fixed bottom-4 right-4 p-3 rounded-full shadow-lg md:hidden
          bg-primary text-primary-foreground hover:bg-primary/90 transition-colors duration-200 z-50`}
        aria-label="Compose new email"
        disabled={!selectedGmailId || !cred_data} // Disable if no account selected
      >
        <Edit size={24} />
      </button>
    </div>
  );
};

export default Gmail;