
import { MessageTimeline, Message } from "@/components/messages/MessageTimeline";
import { MessagesSquare } from "lucide-react";

const WhatsApp = () => {
  // Mock data
  const messages: Message[] = [
    {
      id: "w1",
      date: "2025-04-24 09:30",
      sender: "Sarah Johnson",
      platform: "whatsapp",
      message: "Hey, can you send me an update on the CloudBrief OS project timeline?",
      status: "new"
    },
    {
      id: "w2",
      date: "2025-04-24 08:15",
      sender: "Dev Team Group",
      platform: "whatsapp",
      message: "The new UI designs are ready for review. Please check and provide feedback.",
      status: "followup"
    },
    {
      id: "w3",
      date: "2025-04-23 16:42",
      sender: "Alex Wong",
      platform: "whatsapp",
      message: "I've fixed the bug in the messaging module. Let me know if you need anything else.",
      status: "read"
    },
    {
      id: "w4",
      date: "2025-04-23 14:20",
      sender: "Marketing Team",
      platform: "whatsapp",
      message: "We need to schedule a meeting to discuss the launch strategy for next month.",
      status: "scheduled"
    }
  ];

  return <MessageTimeline messages={messages} title="WhatsApp" icon={<MessagesSquare size={20} />} />;
};

export default WhatsApp;
