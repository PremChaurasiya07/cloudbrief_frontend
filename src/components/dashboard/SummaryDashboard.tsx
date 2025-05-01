'use client'
import { CollapsibleSummary } from "./CollapsibleSummary";
import { ChatInterface } from "../chat/ChatInterface";
import { useEffect,useState } from "react";
import { useSummaryLoading } from "@/context/summaryloading";
import query from "@/langflow/query";
import Summary from "@/langflow/summary";
export function SummaryDashboard() {
  // const [getsummary, setgetsummary] = useState<any>();
  // const { setLoading } = useSummaryLoading();

  // if (!getsummary) {
  //   setLoading(true);
  // } else {
  //   setLoading(false);
  // }

  // const summary_get = async () => {
  //   const response = await Summary();
  //   setgetsummary(response);
  //   if (!getsummary) {
  //     setLoading(true);
  //   }
  //   console.log(response);
  // };

  // useEffect(() => {
  //   summary_get();
  // }, []);

  return (
    <div className="space-y-6 h-full relative">
      <div>
        <h1 className="text-2xl font-bold mb-1">Daily Brief</h1>
        <p className="text-muted-foreground text-sm mb-4">
          Here's your AI-generated summary for what's important today
        </p>
      </div>

      {/* Set z-index for CollapsibleSummary */}
      <div className="relative z-10">
        <CollapsibleSummary />
      </div>

      {/* ChatInterface */}
      <div className="flex flex-col h-[calc(100vh-20rem)]">
        <ChatInterface />
      </div>
    </div>
  );
}
