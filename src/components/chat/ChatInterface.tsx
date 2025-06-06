import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import History from "@/langflow/gethistory";
import botpic from '../../../public/botpic.jpg'
import { useUserCred } from "@/context/usercred";

interface Message {
  id: string;
  content: string;
  sender: "User" | "assistant" | "loading";
  timestamp: Date;
  platform?: "WhatsApp" | "Gmail" | "Assistant" | "User";
  status?: "new" | "follow-up" | "schedule";
}

function PlatformIcon({ platform }: { platform?: string }) {
  switch (platform) {
    case "WhatsApp":
      return <Phone className="inline-block w-4 h-4 text-green-500 mr-1" />;
    case "Gmail":
      return <Mail className="inline-block w-4 h-4 text-red-500 mr-1" />;
    case "Assistant":
      return <MessageSquare className="inline-block w-4 h-4 text-blue-500 mr-1" />;
    case "User":
    default:
      return null;
  }
}

function StatusEmoji({ status }: { status?: string }) {
  switch (status) {
    case "new":
      return <span className="mr-1">🟢</span>;
    case "follow-up":
      return <span className="mr-1">⚠️</span>;
    case "schedule":
      return <span className="mr-1">📅</span>;
    default:
      return null;
  }
}

function Avatar({ sender }: { sender: string }) {
  const avatarUrl = sender === "User" ? "/avatars/user.png" : botpic;

  return (
    <img
      src={avatarUrl}
      alt={`${sender} avatar`}
      className="w-8 h-8 rounded-full cursor-pointer select-none"
      onClick={() => alert(`Open profile for: ${sender}`)}
      draggable={false}
    />
  );
}

// Linkify URLs in message content
function linkify(text: string | undefined | null) {
  if (typeof text !== "string") return text;

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline hover:text-blue-800 break-words"
        >
          {part}
        </a>
      );
    }
    return part;
  });
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {userid}=useUserCred();
  console.log(userid)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "User",
      timestamp: new Date(),
      platform: "User",
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "Typing...",
      sender: "loading",
      timestamp: new Date(),
      platform: "Assistant",
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_URL}/api/langflow/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input, userid }),
      });

      const data = await response.json();
      console.log(data)
      const output = data.summary || "No response from assistant.";

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                sender: "assistant",
                platform: "Assistant",
                content: output,
                status: "new",
              }
            : msg
        )
      );
    } catch (error) {
      console.error("Error during fetch:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                sender: "assistant",
                platform: "Assistant",
                content: "Something went wrong. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Load messages on mount
  const fetchMessages = async () => {
    try {
      const response = await History({ user_id: userid });
      const formattedMessages = response.map((msg: any) => ({
        id: msg.id,
        content: msg.text,
        sender: msg.sender_name === "User" ? "User" : "assistant",
        timestamp: new Date(msg.timestamp),
        platform:
          msg.platform || (msg.sender_name === "User" ? "User" : "Assistant"),
        status: msg.status,
      }));
      console.log(response)
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const renderMessages = () => {
  if (messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground select-none">
        <img src={botpic} alt="Bot" className="w-20 h-20 mb-4 opacity-80" />
        <h2 className="text-lg font-semibold">Start Chatting</h2>
        <p className="text-sm mt-1">Ask anything to begin your conversation</p>
      </div>
    );
  }

  const messageGroups: JSX.Element[] = [];
  let currentDate = messages[0].timestamp;

  messageGroups.push(
    <div
      key={`date-${currentDate.toISOString()}`}
      className="text-sm flex justify-center my-4 select-none"
    >
      <div className="bg-background px-3 py-1 rounded-full border text-sm text-muted-foreground">
        {format(currentDate, "MMMM d, yyyy")}
      </div>
    </div>
  );

  messages.forEach((message) => {
    if (!isSameDay(message.timestamp, currentDate)) {
      currentDate = message.timestamp;
      messageGroups.push(
        <div
          key={`date-${currentDate.toISOString()}`}
          className="text-sm flex justify-center my-4 select-none"
        >
          <div className="bg-background px-3 py-1 rounded-full border text-sm text-muted-foreground">
            {format(currentDate, "MMMM d, yyyy")}
          </div>
        </div>
      );
    }

    messageGroups.push(
      <div
        key={message.id}
        className={`flex items-center mb-2 ${
          message.sender === "User" ? "justify-end" : "justify-start"
        }`}
      >
        {message.sender !== "User" && <Avatar sender={message.sender} />}
        <Card
          className={`p-4 whitespace-pre-wrap max-w-[80%] text-sm ${
            message.sender === "User"
              ? "ml-2 bg-primary text-primary-foreground"
              : message.sender === "loading"
              ? "mr-2 bg-muted italic opacity-70 max-w-[80%]"
              : "mr-2 bg-muted max-w-[80%]"
          }`}
        >
          <div className="flex items-center">
            <PlatformIcon platform={message.platform} />
            <StatusEmoji status={message.status} />
            <span style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
              {linkify(message.content)}
            </span>
          </div>
        </Card>
        {message.sender === "User" && <Avatar sender={message.sender} />}
      </div>
    );
  });

  return messageGroups;
};

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 pb-4">
        {renderMessages()}
        <div ref={messagesEndRef} />
      </div>

      <div className="w-full sticky bottom-0 bg-background border-t p-2 pb-0 z-10">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isLoading ? "Wait for assistant to reply..." : "Ask anything..."}
            className="min-h-[50px] resize-none flex-1"
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !isLoading) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="px-4 h-fit">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
