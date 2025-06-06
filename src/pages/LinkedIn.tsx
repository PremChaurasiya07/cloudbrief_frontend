
import { useState } from "react";
import { MessageTimeline, Message } from "@/components/messages/MessageTimeline";
import { Linkedin } from "lucide-react";

const LinkedIn = () => {
  // Mock data
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "l1",
      date: "2025-04-24 15:30",
      sender: "Jordan Smith, Product Manager at TechCorp",
      platform: "linkedin",
      message: "Hi there! I saw your post about CloudBrief OS and I'm interested in learning more about its integration capabilities.",
      status: "new"
    },
    {
      id: "l2",
      date: "2025-04-23 13:15",
      sender: "Startup Investors Network",
      platform: "linkedin",
      message: "You've been invited to our exclusive pitch event next month. Would be great to have CloudBrief OS represented.",
      status: "followup"
    },
    {
      id: "l3",
      date: "2025-04-22 09:40",
      sender: "Taylor Johnson, Recruiter",
      platform: "linkedin",
      message: "We have several clients looking for productivity experts. Would you be open to consulting opportunities?",
      status: "read"
    }
  ]);

  return (
    <MessageTimeline 
      messages={messages} 
      title="LinkedIn" 
      icon={<Linkedin size={20} />} 
    />
  );
}

export default LinkedIn;
