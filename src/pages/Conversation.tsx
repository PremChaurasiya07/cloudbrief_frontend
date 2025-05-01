import { ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

interface Contact {
  id: string;
  name: string;
  isGroup: boolean;
  timestamp: string;
}

interface Message {
  id: string;
  content: string;
  created_at: string;
  isSenderMatch: boolean;
  sender: string;
}

const Conversation = () => {
  const { platform } = useParams<{ platform: string }>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [mobileOpen, setMobileOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const getPlatformEmoji = (platform: string | undefined) => {
    switch (platform) {
      case 'whatsapp': return '💬';
      case 'gmail': return '📧';
      case 'twitter': return '🐦';
      case 'linkedin': return '👔';
      default: return '📱';
    }
  };

  const fetchContacts = async () => {
    try {
      setContactsLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/auth/${platform === 'whatsapp' ? 'baileys' : platform}/getcontacts`
      );
      const data: Contact[] = await response.json();
      setContacts(data);

      if (data.length > 0) {
        setSelectedContact(data[0]);
      }
    } catch (err) {
      console.error('Error fetching contacts:', err);
    } finally {
      setContactsLoading(false);
    }
  };

  const fetchMessages = async (contactId: string, name: string) => {
    try {
      const response = await fetch(`http://localhost:3000/api/auth/baileys/getcontacts/fetch_chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sender: contactId }),
      });
      const data = await response.json();
      const modifiedMessages = data.messages.map((message: any) => ({
        ...message,
        isSenderMatch: message.sender !== name,
      }));
      setMessages(modifiedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, [platform]);

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact.id, selectedContact.name);
    }
  }, [selectedContact]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedContact) {
        fetchMessages(selectedContact.id, selectedContact.name);
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [selectedContact]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact);
    if (isMobile) setMobileOpen(false);
  };

  const formatContactName = (contact: Contact) => {
    return contact.isGroup ? `${contact.name} (Group)` : contact.name;
  };

  const Loader = () => (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      <p className="mt-4 text-sm">Loading...</p>
    </div>
  );

  return (
    <div className="flex h-screen w-[96.4vw] fixed top-0 left-14">
      {/* Sidebar */}
      {!isMobile && (
        <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
          <div className="p-4 border-b">
            <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2 mt-4">
              <span className="text-2xl">{getPlatformEmoji(platform)}</span>
              <h2 className="font-semibold capitalize">{platform}</h2>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
            {contactsLoading ? (
              <Loader />
            ) : (
              contacts.map((contact) => (
                <div key={contact.id}>
                  <div
                    className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-muted/10'
                    }`}
                    onClick={() => handleContactSelect(contact)}
                  >
                    <div className="flex-1 truncate">
                      {formatContactName(contact)}
                    </div>
                  </div>
                  <Separator className="my-1" />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
          <div className="absolute top-4 left-4 z-10">
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon">
                <Menu className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
          </div>
          <DrawerContent side="left" className="w-[80%] max-w-sm h-full">
            <div className="p-4 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">{getPlatformEmoji(platform)}</span>
                <h2 className="font-semibold capitalize">{platform}</h2>
              </div>
              <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {contactsLoading ? (
                  <Loader />
                ) : (
                  contacts.map((contact) => (
                    <div key={contact.id}>
                      <div
                        className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer ${
                          selectedContact?.id === contact.id
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-muted/10'
                        }`}
                        onClick={() => handleContactSelect(contact)}
                      >
                        <div className="flex-1 truncate">
                          {formatContactName(contact)}
                        </div>
                      </div>
                      <Separator className="my-1" />
                    </div>
                  ))
                )}
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        <div className="border-b p-4 h-16 flex items-center justify-between sticky top-0 bg-background z-10">
          <div className="flex items-center gap-2">
            {isMobile && selectedContact && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <h3 className="font-medium">
              {selectedContact
                ? formatContactName(selectedContact)
                : isMobile
                ? "Messages"
                : "Select a contact"}
            </h3>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          {selectedContact ? (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isSenderMatch ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-lg p-3 max-w-[80%] ${
                      message.isSenderMatch
                        ? 'bg-green-300/30 text-right'
                        : 'bg-muted/10 text-left'
                    }`}
                  >
                    {selectedContact.isGroup && (
                      <p className="font-semibold text-xs text-muted-foreground">
                        {message.sender}
                      </p>
                    )}
                    <p>{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
              {isMobile ? (
                <Button variant="outline" className="mt-4" onClick={() => setMobileOpen(true)}>
                  Open Contacts
                </Button>
              ) : (
                <p>Select a contact to start viewing messages</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conversation;



// import { ChevronLeft, Menu } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { useParams } from "react-router-dom";
// import { useState, useEffect, useRef } from "react";
// import { useMediaQuery } from "@/hooks/use-media-query";
// import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";

// interface Contact {
//   id: string;
//   name: string;
//   isGroup: boolean;
//   timestamp: string;
// }

// interface Message {
//   id: string;
//   content: string;
//   created_at: string;
//   isSenderMatch: boolean;
//   sender: string;
// }

// const Conversation = () => {
//   const { platform } = useParams<{ platform: string }>();
//   const [contacts, setContacts] = useState<Contact[]>([]);
//   const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
//   const [messages, setMessages] = useState<Message[]>([]);
//   const [contactsLoading, setContactsLoading] = useState(false);
//   const [messagesLoading, setMessagesLoading] = useState(false);
//   const isMobile = useMediaQuery("(max-width: 768px)");
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const getPlatformEmoji = (platform: string | undefined) => {
//     switch (platform) {
//       case "whatsapp":
//         return "💬";
//       case "gmail":
//         return "📧";
//       case "twitter":
//         return "🐦";
//       case "linkedin":
//         return "👔";
//       default:
//         return "📱";
//     }
//   };

//   const fetchContacts = async () => {
//     try {
//       setContactsLoading(true);
//       const response = await fetch(
//         `http://localhost:3000/api/auth/${platform === "whatsapp" ? "baileys" : platform}/getcontacts`
//       );
//       const data: Contact[] = await response.json();
//       setContacts(data);
//       if (data.length > 0) setSelectedContact(data[0]);
//     } catch (err) {
//       console.error("Error fetching contacts:", err);
//     } finally {
//       setContactsLoading(false);
//     }
//   };

//   const fetchMessages = async (contactId: string, contactName: string) => {
//     try {
//       setMessagesLoading(true);
//       const response = await fetch(`http://localhost:3000/api/auth/baileys/getcontacts/fetch_chats`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ sender: contactId }),
//       });

//       const data = await response.json();

//       const modifiedMessages: Message[] = data.messages.map((message: any) => ({
//         id: message.id || `${message.created_at}-${message.sender}`, // fallback ID
//         content: message.content,
//         created_at: message.created_at,
//         sender: message.sender,
//         isSenderMatch: message.sender === "~prem", // Check if the sender is ~prem for zigzag
//       }));

//       setMessages(modifiedMessages);
//     } catch (err) {
//       console.error("Error fetching messages:", err);
//     } finally {
//       setMessagesLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchContacts();
//   }, [platform]);

//   useEffect(() => {
//     if (selectedContact) {
//       fetchMessages(selectedContact.id, selectedContact.name);
//     }
//   }, [selectedContact]);

//   useEffect(() => {
//     const interval = setInterval(() => {
//       if (selectedContact) {
//         fetchMessages(selectedContact.id, selectedContact.name);
//       }
//     }, 20000);
//     return () => clearInterval(interval);
//   }, [selectedContact]);

//   useEffect(() => {
//     if (messages.length > 0) {
//       messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }
//   }, [messages.length]);

//   const handleContactSelect = (contact: Contact) => {
//     setSelectedContact(contact);
//     if (isMobile) setMobileOpen(false);
//   };

//   const formatContactName = (contact: Contact) => {
//     return contact.isGroup ? `${contact.name} (Group)` : contact.name || contact.id.split("@")[0];
//   };

//   const Loader = () => (
//     <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
//       <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
//       <p className="mt-4 text-sm">Loading...</p>
//     </div>
//   );

//   return (
//     <div className="flex h-screen w-[96.4vw] fixed top-0 left-14">
//       {/* Sidebar */}
//       {!isMobile && (
//         <div className="w-64 border-r bg-muted/10 flex flex-col h-full">
//           <div className="p-4 border-b">
//             <Button variant="ghost" className="gap-2" onClick={() => window.history.back()}>
//               <ChevronLeft className="h-4 w-4" />
//               Back
//             </Button>
//             <div className="flex items-center gap-2 mt-4">
//               <span className="text-2xl">{getPlatformEmoji(platform)}</span>
//               <h2 className="font-semibold capitalize">{platform}</h2>
//             </div>
//           </div>

//           <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/30">
//             {contactsLoading ? (
//               <Loader />
//             ) : (
//               contacts.map((contact) => (
//                 <div key={contact.id}>
//                   <div
//                     className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
//                       selectedContact?.id === contact.id
//                         ? "bg-primary/10 text-primary"
//                         : "hover:bg-muted/10"
//                     }`}
//                     onClick={() => handleContactSelect(contact)}
//                   >
//                     <div className="flex-1 truncate">{formatContactName(contact)}</div>
//                   </div>
//                   <Separator className="my-1" />
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       )}

//       {/* Mobile Drawer */}
//       {isMobile && (
//         <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
//           <div className="absolute top-4 left-4 z-10">
//             <DrawerTrigger asChild>
//               <Button variant="outline" size="icon">
//                 <Menu className="h-4 w-4" />
//               </Button>
//             </DrawerTrigger>
//           </div>
//           <DrawerContent side="left" className="w-[80%] max-w-sm h-full">
//             <div className="p-4 h-full flex flex-col">
//               <div className="flex items-center gap-2 mb-4">
//                 <span className="text-2xl">{getPlatformEmoji(platform)}</span>
//                 <h2 className="font-semibold capitalize">{platform}</h2>
//               </div>
//               <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
//                 {contactsLoading ? (
//                   <Loader />
//                 ) : (
//                   contacts.map((contact) => (
//                     <div key={contact.id}>
//                       <div
//                         className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer ${
//                           selectedContact?.id === contact.id
//                             ? "bg-primary/10 text-primary"
//                             : "hover:bg-muted/10"
//                         }`}
//                         onClick={() => handleContactSelect(contact)}
//                       >
//                         <div className="flex-1 truncate">{formatContactName(contact)}</div>
//                       </div>
//                       <Separator className="my-1" />
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </DrawerContent>
//         </Drawer>
//       )}

//       {/* Main Chat Area */}
//       <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
//         <div className="border-b p-4 h-16 flex items-center justify-between sticky top-0 bg-background z-10">
//           <div className="flex items-center gap-2">
//             {isMobile && selectedContact && (
//               <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)}>
//                 <ChevronLeft className="h-4 w-4" />
//               </Button>
//             )}
//             <h3 className="font-medium">
//               {selectedContact
//                 ? formatContactName(selectedContact)
//                 : isMobile
//                 ? "Messages"
//                 : "Select a contact"}
//             </h3>
//           </div>
//         </div>

//         <div className="flex-1 p-4 overflow-y-auto">
//           {selectedContact ? (
//             messagesLoading ? (
//               <Loader />
//             ) : (
//               <div className="space-y-4">
//                 {messages.map((message) => (
//                   <div
//                     key={message.id}
//                     className={`flex ${message.isSenderMatch ? "justify-end" : "justify-start"}`}
//                   >
//                     <div
//                       className={`rounded-lg p-3 max-w-[80%] ${
//                         message.isSenderMatch
//                           ? "bg-green-300/30 text-right"
//                           : "bg-muted/10 text-left"
//                       }`}
//                     >
//                       {selectedContact.isGroup && (
//                         <p className="font-semibold text-xs text-muted-foreground">{message.sender}</p>
//                       )}
//                       <p>{message.content}</p>
//                       <p className="text-xs text-muted-foreground mt-1">
//                         {new Date(message.created_at).toLocaleString()}
//                       </p>
//                     </div>
//                   </div>
//                 ))}
//                 <div ref={messagesEndRef} />
//               </div>
//             )
//           ) : (
//             <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-4">
//               {isMobile ? (
//                 <Button variant="outline" className="mt-4" onClick={() => setMobileOpen(true)}>
//                   Open Contacts
//                 </Button>
//               ) : (
//                 <p>Select a contact to start viewing messages</p>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Conversation;
