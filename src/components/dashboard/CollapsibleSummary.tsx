import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSummaryLoading } from "@/context/summaryloading";
import Summary from "@/langflow/summary";
import { supabase } from "@/lib/supabase";

export function CollapsibleSummary() {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [summary, setSummary] = useState("");
  const { isLoading, setLoading } = useSummaryLoading();

  const USER_ID = "00000000-0000-0000-0000-000000000001"; // Replace with real user ID

  const decodeUnicode = (text: string) => {
    try {
      return decodeURIComponent(JSON.parse(`"${text}"`));
    } catch (err) {
      console.error("Unicode decode error:", err);
      return text;
    }
  };

  const fetchSummaryFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("memory_briefs")
        .select("brief, last_fetched")
        .eq("user_id", USER_ID)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("❌ Error fetching summary:", error.message, error.details);
      }

      return data || null;
    } catch (err) {
      console.error("❌ Fetch error:", err);
      return null;
    }
  };

  const updateSummaryInSupabase = async (newSummary: string) => {
    const now = new Date().toISOString();

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("memory_briefs")
        .select("user_id")
        .eq("user_id", USER_ID)
        .single();

      if (fetchError && fetchError.code === "PGRST116") {
        // No row exists — insert
        const { error: insertError } = await supabase
          .from("memory_briefs")
          .insert({
            user_id: USER_ID,
            brief: newSummary,
            last_fetched: now,
          });

        if (insertError) {
          console.error("❌ Insert error:", insertError.message, insertError.details);
        } else {
          console.log("✅ New summary inserted.");
        }
      } else {
        // Row exists — update
        const { error: updateError } = await supabase
          .from("memory_briefs")
          .update({
            brief: newSummary,
            last_fetched: now,
          })
          .eq("user_id", USER_ID);

        if (updateError) {
          console.error("❌ Update error:", updateError.message, updateError.details);
        } else {
          console.log("✅ Summary updated.");
        }
      }
    } catch (err) {
      console.error("❌ Unexpected DB error:", err);
    }
  };

 const getSummary = async () => {
  setLoading(true);

  const cached = await fetchSummaryFromSupabase();

  if (cached?.last_fetched) {
    const lastFetchedUTC = new Date(cached.last_fetched); // this is already in UTC
    const nowUTC = new Date(); // browser Date is also UTC-compatible for comparisons

    const diffMs = nowUTC.getTime() - lastFetchedUTC.getTime();
    const diffInHours = diffMs / (1000 * 60 * 60);

    console.log(`⏱ Last summary fetched ${diffInHours.toFixed(2)} hours ago`);

    if (diffInHours < 1) {
      console.log("✅ Cached summary is fresh. Using it.");
      setSummary(cached.brief);
      setLoading(false);
      return;
    }

    console.log("🆕 Cached summary expired. Regenerating...");
  } else {
    console.log("📭 No summary found. Generating new one...");
  }

  try {
    const freshSummary = await Summary();
    setSummary(freshSummary);
    await updateSummaryInSupabase(freshSummary);
  } catch (err) {
    console.error("❌ Error generating summary:", err);
  }

  setLoading(false);
};



  useEffect(() => {
    getSummary();
  }, []);

  return (
    <Card className="mb-3 relative z-20">
      <div className="p-3">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Today's Summary</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </Button>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out ${
            isCollapsed
              ? "min-h-[80px] overflow-hidden"
              : "max-h-[100px] overflow-y-scroll"
          }`}
        >
          {isLoading ? (
            <p className="text-muted-foreground text-sm">Loading summary...</p>
          ) : (
            <p className="text-muted-foreground text-sm whitespace-pre-line">{summary}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
