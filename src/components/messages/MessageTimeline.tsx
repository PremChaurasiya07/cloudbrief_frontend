import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Circle, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTheme } from "@/context/ThemeContext"; // Import useTheme
import ComposeEmailModal from "../mail/ComposeEmailModal";

export interface Message {
  id: string; // The message ID from the platform (e.g., Gmail's message ID)
  date: string;
  sender: string;
  platform: "whatsapp" | "gmail" | "twitter" | "linkedin";
  message: string;
  status: "new" | "followup" | "scheduled" | "read";
  subject?: string;
  chat_id: string;
  starred:string // The chat_id used for backend operations like deletion (e.g., Google's thread ID or message ID for deletion)
}

interface MessageTimelineProps {
  fetchstarred: () => Promise<void>; // Function to fetch starred messages
  category: string; 
  messages: Message[];
  title: string;
  icon: React.ReactNode;
  selected_gmail?: string; // Optional prop for selected Gmail account
  fecthmessagesForAccount: (account: any) => Promise<void>; // Function to refresh messages
  cred_data: any; // Credentials data needed for refresh, type more strictly if possible
  fetchdraft?: () => Promise<void>; // Optional function to fetch drafts
 
}

export function MessageTimeline({
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
  console.log("Rendering MessageTimeline with category:", category);
  const [searchTerm, setSearchTerm] = useState("");
  const [draftopen, setdraftopen] = useState(false);
  const [draftdata, setdraftdata] = useState("");
  
  
  const navigate = useNavigate();
  console.log("Selected Gmail ID:", selected_gmail);

  const { theme } = useTheme(); // Use the theme hook

  const filteredMessages = messages.filter((message) => {
    return (
      !searchTerm ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.subject?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const starred_message = async (chat_id) => {
    const {data:check,error:fetcherror}=await supabase.from("memory_entries").select("starred").eq("chat_id", chat_id).maybeSingle();
    if(fetcherror){
      return console.error("Error fetching starred status:", fetcherror);
    }
    if(check.starred == "yes"){
      const {data,error}=await supabase.from("memory_entries").update({
      starred: " ",}).eq("chat_id", chat_id);
      console.log("unstarred successfully")
    }else{}
    const {data,error}=await supabase.from("memory_entries").update({
      starred: "yes",}).eq("chat_id", chat_id)
    if(error){
      return console.error("Error updating starred status:", error);
    }
    console.log("starred successfully")
    
  }

  const delete_mail = async (chat_id_to_delete: string) => {
    // console.log("Attempting to delete message with chat ID:", chat_id_to_delete);
    if (!selected_gmail) {
        console.error("No Gmail account selected for deletion.");
        return;
    }

    const { data, error } = await supabase
      .from("email_auth")
      .select("access_token,refresh_token")
      .eq("gmail_id", selected_gmail)
      .maybeSingle();

    if (error || !data) {
      console.error("Failed to fetch access token from DB:", error);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/auth/gmail/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            gmailMessageId: chat_id_to_delete,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to delete message: ${response.statusText}`
        );
      }
      console.log("Message deleted successfully from Gmail API.");

      const USER_ID = "00000000-0000-0000-0000-000000000001";
      const accountForRefresh = { ...cred_data, user_id: USER_ID, gmail_id: selected_gmail };
      if( category == 'STARRED') {
      await fetchstarred(); // Refresh starred messages if category is 'STARRED'
      }else{
        await fecthmessagesForAccount(accountForRefresh);
      
      } 
       
    } catch (error: any) {
      console.error("Error deleting message:", error.message || error);
    }
  };


  //function to delete draft
const delete_draft = async (id) => {
  // console.log("Attempting to delete draft with ID:", id);
    if (!selected_gmail) {
        console.error("No Gmail account selected for deletion.");
        return;
    }

    const { data, error } = await supabase
      .from("email_auth")
      .select("refresh_token")
      .eq("gmail_id", selected_gmail)
      .maybeSingle();

    if (error || !data) {
      console.error("Failed to fetch access token from DB:", error);
      return;
    }
    const USER_ID = "00000000-0000-0000-0000-000000000001";
    try {
      const response = await fetch(
        `http://localhost:3000/api/auth/gmail/deletedraft`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            draftId: id,
            refreshToken: data.refresh_token,
            userId: USER_ID // Replace with actual user ID if needed
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to delete draft: ${response.statusText}`
        );
      }
      console.log("drfat deleted successfully.");
      await fetchdraft();
    } catch (error: any) {
      console.error("Error deleting draft:", error.message || error);
    }
  };

  // Dynamic theme classes
  const searchBgClass = `bg-input`; // Or bg-card, depending on your design system
  const searchBorderClass = `border-input`;
  const searchTextColorClass = `text-foreground`;
  const searchPlaceholderClass = `placeholder-muted-foreground`;
  const messageBgClass = `bg-card`;
  const messageBorderClass = `border-border`;
  const messageHoverBgClass = `hover:bg-accent`;
  const senderTextColorClass = `text-card-foreground`;
  const subjectMessageTextColorClass = `text-muted-foreground`;
  const dateTextColorClass = `text-muted-foreground`;
  const actionButtonColorClass = `text-muted-foreground`; // Default button color
  const actionButtonHoverColorClass = `hover:text-primary`; // Example hover color

  return (
    <div className="flex flex-col h-full w-full">
      {draftopen && ( 
        <ComposeEmailModal category={category} userId="00000000-0000-0000-0000-000000000001" onClose={()=>(setdraftopen(false))} message={draftdata} fromEmail={selected_gmail} />
       )}
      {/* Sticky Search Bar - uses theme classes */}
      <div className={`flex flex-col sm:flex-row gap-2 sticky top-0 ${searchBgClass} z-10 border-b ${messageBorderClass} p-2 flex-shrink-0`}>
        <div className="relative flex-1 min-w-0">
          <Search className={`absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 ${subjectMessageTextColorClass}`} />
          <input
            placeholder="Search..."
            className={`pl-7 py-1.5 sm:pl-8 sm:py-2 border rounded w-full text-xs sm:text-sm ${searchBgClass} ${searchTextColorClass} ${searchBorderClass} ${searchPlaceholderClass} focus:outline-none focus:ring-2 focus:ring-ring`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Scrollable Message List Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-2">
        {filteredMessages.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-4 sm:py-8 ${subjectMessageTextColorClass} h-full`}>
            <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🎉</div>
            <h3 className="text-sm sm:text-md font-medium">You're all caught up!</h3>
            <p className="text-xs sm:text-sm">No messages to display.</p>
          </div>
        ) : (
          <div className="space-y-1.5 sm:space-y-2 ">
            {filteredMessages.map((mess) => (
              <div
                key={mess.id}
                onClick={() => {
                  if (mess.platform === "gmail") {
                    if(category=='DRAFT' ) {
                      setdraftdata(mess);
                      // Open the draft in a modal or a different view
                      // If it's a draft, we might want to handle it differently
                      setdraftopen(true) 

                    }
                    
                    else{
                      navigate(`/gmail/${mess.id}`);
                    }
                    
                  }
                }}
                className={`p-2 sm:p-3 border rounded cursor-pointer transition
                             ${
                               mess.status === "new"
                                 ? "border-teal-600 bg-teal-900/30 hover:bg-teal-900/50" // Specific 'new' mess styling
                                 : `${messageBorderClass} ${messageBgClass} ${messageHoverBgClass}` // Theme-aware for other statuses
                             }
                             ${senderTextColorClass} min-w-0 overflow-hidden
                             flex items-start`}
              >
                {/* Left section: Status, Sender, Subject, Message Preview */}
                <div className="flex items-start gap-1 sm:gap-2 flex-1 min-w-0">
                  <div className="mt-1 flex-shrink-0">
                    {mess.status === "new" && (
                      <Circle className="h-2 w-2 text-teal-400 animate-pulse" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className={`flex flex-col sm:flex-row sm:items-baseline sm:gap-1 text-sm sm:text-base min-w-0 ${senderTextColorClass}`}>
                      <span className="font-semibold truncate max-w-full sm:max-w-[150px] md:max-w-[200px]">
                        {mess.sender}
                      </span>
                      {mess.subject && (
                        <>
                          <span className={`${subjectMessageTextColorClass} hidden sm:inline`}>-</span>
                          <span className={`${subjectMessageTextColorClass} text-xs sm:text-sm truncate flex-1 min-w-0`}>
                            {mess.subject}
                          </span>
                        </>
                      )}
                    </div>
                    <p className={`text-xs ${subjectMessageTextColorClass} truncate mt-0.5 sm:mt-1 break-words`}>
                      {mess.message}
                    </p>
                  </div>
                </div>
                {/* Right section: Date, Actions */}
                <div className="flex flex-col items-end ml-1 sm:ml-2 flex-shrink-0 min-w-[70px] sm:min-w-[90px]">
                  <span className={`text-xxs sm:text-xs ${dateTextColorClass} whitespace-pre-line text-right`}>
                    {mess.date}
                  </span>
                  <div className="flex gap-0.5 sm:gap-1 mt-0.5 sm:mt-1">
                    <button
                      className={`p-1 ${actionButtonColorClass} hover:text-red-500 transition`} // Delete is always red
                      onClick={(e) => {
                        e.stopPropagation();
                        if (category === 'DRAFT') {
                          delete_draft(mess.id);
                        } else{
                        delete_mail(mess.chat_id);
                        }
                      }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                    {
                      (category != 'DRAFT') && (
                        <button
                      className={`p-1 ${actionButtonColorClass} hover:text-yellow-500 transition`} // Star is always yellow
                      onClick={(e) => e.stopPropagation()}
                      title="Star"
                    >
                      <Star  className="h-3.5 w-3.5 sm:h-4 sm:w-4" style={(mess.starred=='yes')?{fill:"yellow"}:{fill:"none"}} onClick={()=>starred_message(mess.chat_id)} />
                    </button>)
                    }
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}