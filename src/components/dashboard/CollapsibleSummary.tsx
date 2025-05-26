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


  const decodeUnicode = (text: string) => {
    try {
      return decodeURIComponent(JSON.parse(`"${text}"`));
    } catch (err) {
      console.error("Unicode decode error:", err);
      return text;
    }
  };

  const USER_ID = "00000000-0000-0000-0000-000000000001"; // Replace this with actual user ID

  // Format date to IST in YYYY-MM-DD HH:mm:ss
  const formatToIST = (date: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Kolkata",
      hour12: false,
    };
    const formatted = new Date(date).toLocaleString("en-IN", options);
    const [datePart, timePart] = formatted.split(", ");
    const isoDate = datePart.split("/").reverse().join("-");
    return `${isoDate} ${timePart}`;
  };

  // Fetch existing summary from Supabase
  const fetchSummaryFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("memory_briefs")
        .select("brief, last_fetched")
        .match({ user_id: USER_ID })
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("❌ Error fetching from memory_briefs:", error.message, error.details);
      }

      return data || null;
    } catch (err) {
      console.error("❌ Unexpected fetch error:", err);
      return null;
    }
  };

  // Update or insert new summary into Supabase
  const updateSummaryInSupabase = async (newSummary: string) => {
    const now = new Date().toISOString();
    const formattedTimestamp = formatToIST(now);

    try {
      const { data: existing, error: fetchError } = await supabase
        .from("memory_briefs")
        .select("user_id")
        .eq("user_id", USER_ID)
        .single();

      if (fetchError && fetchError.code === "PGRST116") {
        // No existing row — insert
        const { error: insertError } = await supabase
          .from("memory_briefs")
          .insert({
            user_id: USER_ID,
            brief: newSummary,
            last_fetched: formattedTimestamp,
          });

        if (insertError) {
          console.error("❌ Insert error:", insertError.message, insertError.details);
        } else {
          console.log("✅ Summary inserted to Supabase.");
        }
      } else {
        // Existing row — update
        const { error: updateError } = await supabase
          .from("memory_briefs")
          .update({
            brief: newSummary,
            last_fetched: formattedTimestamp,
          })
          .match({ user_id: USER_ID });

        if (updateError) {
          console.error("❌ Update error:", updateError.message, updateError.details);
        } else {
          console.log("✅ Summary updated in Supabase.");
        }
      }
    } catch (err) {
      console.error("❌ Unexpected update error:", err);
    }
  };

  // Main summary fetch logic
  const getSummary = async () => {
    setLoading(true);

    const fetchedData = await fetchSummaryFromSupabase();

    if (fetchedData) {
      const lastFetched = new Date(fetchedData.last_fetched).getTime();
      const now = Date.now();
      const hoursElapsed = (now - lastFetched) / (1000 * 60 * 60); // convert ms to hours

      console.log(`⏱ Hours since last fetch: ${hoursElapsed.toFixed(2)}h`);

      if (hoursElapsed >= 3) {
        console.log("🆕 Fetching new summary...");
        const newSummary = await Summary();
        setSummary(newSummary);
        await updateSummaryInSupabase(newSummary);
      } else {
        console.log("📄 Using cached summary.");
        setSummary(fetchedData.brief);
      }
    } else {
      console.log("📭 No summary found, fetching fresh...");
      const newSummary = await Summary();
      setSummary(newSummary);
      await updateSummaryInSupabase(newSummary);
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
            <p className="text-muted-foreground text-sm whitespace-pre-line">{decodeUnicode(summary)}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
