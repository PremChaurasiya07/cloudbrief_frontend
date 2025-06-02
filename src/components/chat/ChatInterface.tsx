import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { format, isSameDay } from "date-fns";
import History from "@/langflow/gethistory";


interface Message {
  id: string;
  content: string;
  sender: "User" | "assistant" | "loading";
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const decodeUnicode = (text: string) => {
    try {
      return decodeURIComponent(JSON.parse(`"${text}"`));
    } catch (err) {
      console.error("Unicode decode error:", err);
      return text;
    }
  };
  const userid="00000000-0000-0000-0000-000000000001";
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "User",
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "Typing...",
      sender: "loading",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3000/api/langflow/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: input }),
      });
      console.log("Response status:", response);

      const data = await response.json();
     console.log(data);
      const output = data.outputs[0].outputs[0].results.message.data.text || "No response from assistant.";
      console.log("Assistant output:", output);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === loadingMessage.id
            ? { ...msg, sender: "assistant", content: output }
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
                content: "Something went wrong. Please try again.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await History({ user_id: "user_2" });
      const formattedMessages = response.map((msg: any) => ({
        id: msg.id,
        content: msg.text,
        sender: msg.sender_name === "User" ? "User" : "assistant",
        timestamp: new Date(msg.timestamp),
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const renderMessages = () => {
    if (messages.length === 0) return null;

    const messageGroups: JSX.Element[] = [];
    let currentDate = messages[0].timestamp;

    messageGroups.push(
      <div key={`date-${currentDate.toString()}`} className="text-sm flex justify-center my-4">
        <div className="bg-background px-3 py-1 rounded-full border text-sm text-muted-foreground">
          {format(currentDate, "MMMM d, yyyy")}
        </div>
      </div>
    );

    messages.forEach((message) => {
      if (!isSameDay(message.timestamp, currentDate)) {
        currentDate = message.timestamp;
        messageGroups.push(
          <div key={`date-${currentDate.toString()}`} className="text-sm flex justify-center my-4">
            <div className="bg-background px-3 py-1 rounded-full border text-sm text-muted-foreground">
              {format(currentDate, "MMMM d, yyyy")}
            </div>
          </div>
        );
      }

      messageGroups.push(
        <Card
          key={message.id}
          className={`p-4 whitespace-pre-wrap mb-2 text-sm ${
            message.sender === "User"
              ? "ml-auto bg-primary text-primary-foreground max-w-[80%]"
              : message.sender === "loading"
              ? "mr-auto bg-muted max-w-[80%] italic opacity-70"
              : "mr-auto bg-muted max-w-[80%]"
          }`}
        >
          {message.content}
        </Card>
      );
    });

    return messageGroups;
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Chat messages area (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 pb-4"> {/* Add bottom padding to prevent overlap */}
        <div className="space-y-3" ref={scrollAreaRef}>
          {renderMessages()}
          <div ref={messagesEndRef} />
        </div>
      </div>
  
      {/* Input area (sticky) */}
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
          <Button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 h-fit"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
  
  
}
