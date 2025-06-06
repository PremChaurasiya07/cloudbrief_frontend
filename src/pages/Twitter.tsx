
import { MessageTimeline, Message } from "@/components/messages/MessageTimeline";
import { Twitter as TwitterIcon } from "lucide-react";

const Twitter = () => {
  // Mock data
  const messages: Message[] = [
    {
      id: "t1",
      date: "2025-04-24 11:20",
      sender: "@techinsider",
      platform: "twitter",
      message: "Check out our latest article on AI productivity tools like CloudBrief OS that are changing how we work!",
      status: "new"
    },
    {
      id: "t2",
      date: "2025-04-24 10:05",
      sender: "@productivityguru",
      platform: "twitter",
      message: "Thanks for the mention! Love what you're doing with CloudBrief OS. Would love to feature it in my next newsletter.",
      status: "followup"
    },
    {
      id: "t3",
      date: "2025-04-23 17:42",
      sender: "@developernews",
      platform: "twitter",
      message: "New frameworks for building productivity tools are gaining traction. Have you considered integrating any of these?",
      status: "read"
    }
  ];

  return <MessageTimeline messages={messages} title="Twitter" icon={<TwitterIcon size={20} />} />;
};

export default Twitter
