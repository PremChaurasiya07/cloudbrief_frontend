
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export function AskAIInput() {
  const [query, setQuery] = useState("");
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // This would connect to the AI service in a real implementation
    console.log("AI Query:", query);
    
    // Reset the input
    setQuery("");
    
    // For demo purposes, we'll show a toast notification
    // toast.success("AI is processing your query...");
  };
  
  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex w-full max-w-3xl mx-auto mb-4"
    >
      <Input
        type="text"
        placeholder="Ask AI anything... e.g. 'What should I follow up on today?'"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="pr-20 h-12 text-base rounded-full shadow-sm"
      />
      <Button
        type="submit"
        className="absolute right-1 top-1 rounded-full h-10 px-4"
        disabled={!query.trim()}
      >
        <Search className="mr-2 h-4 w-4" />
        Ask
      </Button>
    </form>
  );
}
