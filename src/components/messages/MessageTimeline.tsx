import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Circle, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext";
import ComposeEmailModal from "../mail/ComposeEmailModal";
import { useUserCred } from "@/context/usercred";

export interface Message {
  id: string;
  date: string;
  sender: string;
  platform: "whatsapp" | "gmail" | "twitter" | "linkedin";
  message: string;
  status: "new" | "followup" | "scheduled" | "read";
  subject?: string;
  chat_id: string;
  starred: string;
}

interface MessageTimelineProps {
  fetchstarred: () => Promise<void>;
  fetchallmail: () => Promise<void>;
  category: string;
  messages: Message[];
  title: string;
  icon: React.ReactNode;
  selected_gmail?: string;
  fecthmessagesForAccount: (account: any) => Promise<void>;
  cred_data: any;
  fetchdraft?: () => Promise<void>;
}

export function MessageTimeline({
  fetchallmail,
  fetchstarred,
  fetchdraft,
  category,
  messages,
  title,
  icon,
  selected_gmail,
  fecthmessagesForAccount,
  cred_data,
}: MessageTimelineProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [draftopen, setdraftopen] = useState(false);
  const [draftdata, setdraftdata] = useState("");
  const navigate = useNavigate();
  const { theme } = useTheme();
  const {userid}=useUserCred()

  const filteredMessages = messages.filter((message) =>
    [message.message, message.sender, message.subject || ""].some((field) =>
      field.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const starred_message = async (chat_id: string) => {
    const { data: check, error: fetchError } = await supabase
      .from("memory_entries")
      .select("starred")
      .eq("chat_id", chat_id)
      .maybeSingle();

    if (fetchError) {
      return console.error("Error fetching starred status:", fetchError);
    }

    const isStarred = check?.starred === "yes";
    const { error } = await supabase
      .from("memory_entries")
      .update({ starred: isStarred ? "" : "yes" })
      .eq("chat_id", chat_id);

    if (error) {
      console.error("Error updating starred status:", error);
    } else {
      console.log(isStarred ? "Unstarred successfully" : "Starred successfully");
    }
  };

  const delete_mail = async (chat_id_to_delete: string) => {
    if (!selected_gmail) return;

    const { data, error } = await supabase
      .from("email_auth")
      .select("access_token,refresh_token")
      .eq("gmail_id", selected_gmail)
      .maybeSingle();

    if (error || !data) {
      return console.error("Failed to fetch tokens:", error);
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/gmail/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId:userid,
          refreshToken: data.refresh_token,
          gmailMessageId: chat_id_to_delete,
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      const user_id = userid;
      const refreshInput = { ...cred_data, user_id, gmail_id: selected_gmail };
      if (category === "STARRED") {
        await fetchstarred();
      } else if (category === "ALL MAIL") {
        await fetchallmail();
      } else {
        await fecthmessagesForAccount(refreshInput);
      }

    } catch (err) {
      console.error("Error deleting email:", err);
    }
  };

  const delete_draft = async (id: string) => {
    if (!selected_gmail) return;

    const { data, error } = await supabase
      .from("email_auth")
      .select("refresh_token")
      .eq("gmail_id", selected_gmail)
      .maybeSingle();

    if (error || !data) {
      return console.error("Failed to fetch token:", error);
    }

    try {
      const response = await fetch("http://localhost:3000/api/auth/gmail/deletedraft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: id,
          refreshToken: data.refresh_token,
          userId: userid
        }),
      });

      if (!response.ok) throw new Error(await response.text());

      await fetchdraft?.();
    } catch (err) {
      console.error("Error deleting draft:", err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
      {draftopen && (
        <ComposeEmailModal
          category={category}
          userId={userid}
          onClose={() => setdraftopen(false)}
          message={draftdata}
          fromEmail={selected_gmail}
        />
      )}

      {/* Search Bar */}
      <div className="sticky top-0 bg-card border-b border-border z-10 p-2 flex-shrink-0">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 text-muted-foreground h-4 w-4" />
          <input
            className="pl-8 pr-2 py-2 w-full border rounded text-sm bg-input text-foreground border-input placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <div className="text-2xl mb-2">🎉</div>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          filteredMessages.map((mess) => (
            <div
              key={mess.id}
              onClick={() => {
                  if (mess.platform === "gmail") {
                    if (category === "DRAFT") {
                      setdraftdata(mess);
                      setdraftopen(true);
                    } else {
                      navigate(`/gmail/${mess.id}`, { state: { from: window.location.pathname } });
                    }
                  }
                }}

              className={`p-3 border rounded cursor-pointer transition flex items-start gap-2 ${
                mess.status === "new"
                  ? "border-teal-600 bg-teal-900/30 hover:bg-teal-900/50"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              {mess.status === "new" && (
                <Circle className="h-2 w-2 text-teal-400 mt-1 animate-pulse" />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate text-card-foreground">
                  {mess.sender}
                </div>
                {mess.subject && (
                  <div className="text-xs text-muted-foreground truncate">{mess.subject}</div>
                )}
                <div className="text-xs text-muted-foreground truncate">{mess.message}</div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-2">
                {category === "DRAFT" ? (
                  <Trash2
                    className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-red-500"
                    onClick={(e) => {
                      e.stopPropagation();
                      delete_draft(mess.id);
                    }}
                  />
                ) : (
                  <>
                    <Star
                      className={`h-4 w-4 cursor-pointer ${
                        mess.starred === "yes"
                          ? "text-yellow-500"
                          : "text-muted-foreground hover:text-yellow-400"
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        starred_message(mess.chat_id);
                      }}
                    />
                    <Trash2
                      className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        delete_mail(mess.chat_id);
                      }}
                    />
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
