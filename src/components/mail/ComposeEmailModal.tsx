import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { X } from "lucide-react";
import Lottie from "lottie-react";
import aiMailAnimation from "../../../assets/ai-compose.json";
import { supabase } from "@/lib/supabase";

interface ComposeEmailModalProps {
  category?: string; // Optional category prop
  onClose: () => void;
  fromEmail: string;
  userId: string;
  message?:any; // Optional message prop for pre-filling the body
}

const ComposeEmailModal = ({
  category,
  onClose,
  fromEmail,
  userId,
  message,
}: ComposeEmailModalProps) => {
  const { theme } = useTheme();
  const modalRef = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLDivElement>(null);
  const resizerRef = useRef<HTMLDivElement>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const responsiveBreakpoint = 770;
  const isSmallScreen = windowWidth < responsiveBreakpoint;

  const [position, setPosition] = useState({ top: 0, left: 20 });
  const [size, setSize] = useState({ width: 600, height: 600 });
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState(false);
  const [to, setTo] = useState<string>("");
  const [body, setBody] = useState<string>("");
  const [subject, setSubject] = useState<string>("");
  const offset = useRef({ x: 0, y: 0 });

  const [showBotInput, setShowBotInput] = useState(false);
  const [botQuery, setBotQuery] = useState("");
  const [loadingBot, setLoadingBot] = useState(false);

  useEffect(() => {
    if (message) {
      setBody(message.message || "");
      setSubject(message.subject || "");
      setTo(message.to || "");
    }
  }, [message]);

  const savedraft = async (to, body, subject, userId) => {
    // Trim whitespace from inputs to handle cases like "   "
    const trimmedTo = to ? String(to).trim() : '';
    const trimmedBody = body ? String(body).trim() : '';
    const trimmedSubject = subject ? String(subject).trim() : '';

    console.log("Attempting to save draft:", { to: trimmedTo, subject: trimmedSubject, body: trimmedBody });
       onClose();


    // Check if 'to' is empty (most critical for an email)
    if (!trimmedTo) { // This checks for "" (empty string) or any falsy value
        console.log("Recipient 'to' field is empty. Cannot save draft.");
        return; // Stop execution if 'to' is empty
    }

    // Check if ALL fields are empty after trimming
    if (!trimmedTo && !trimmedBody && !trimmedSubject) {
        console.log("All fields (to, body, subject) are empty. No draft to save.");
        return; // Stop execution if everything is empty
    }

    // --- Your existing logic for fetching refreshToken and sending to API ---
    if (!userId) {
        console.log("Please provide userId to save the draft.");
        return;
    }

    try {
        const { data, error } = await supabase
            .from("email_auth")
            .select("refresh_token")
            .eq("user_id", userId)
            .eq("gmail_id", fromEmail) // Assuming fromEmail is defined in scope
            .single();

        if (error) {
            console.error("Error fetching access token:", error);
            return;
        }

        const result = await fetch("http://localhost:3000/api/auth/gmail/compose", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
                to: trimmedTo, // Use trimmed values here
                body: trimmedBody,
                subject: trimmedSubject,
                refreshToken: data.refresh_token,
                userId,
            }),
        });

        console.log("API response:", result);

        if (result.ok) {
            console.log("Draft saved successfully!");
            // You might want to provide user feedback here, e.g., a toast notification
        } else {
            console.error("Error saving draft. Status:", result.status, "Status Text:", result.statusText);
            const errorBody = await result.text(); // Get more details from the response body
            console.error("Error saving draft. Response body:", errorBody);
            // Provide user feedback about the error
        }
    } catch (e) {
        console.error("An unexpected error occurred during draft saving:", e);
        // Provide user feedback about the unexpected error
    }
};


  const sendMail = async () => {
    if (!to || !body || !subject) {
      alert("Please fill all fields");
      return;
    }
    const { data, error } = await supabase
      .from("email_auth")
      .select("refresh_token")
      .eq("user_id", userId)
      .eq("gmail_id", fromEmail)
      .single();
    if (error) {
      console.error("Error fetching access token:", error);
      return;
    }

    const result = await fetch("http://localhost:3000/api/auth/gmail/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to,
        body,
        subject,
        refreshToken: data.refresh_token,
        userId,
      }),
    });

    if (result.ok) {
      console.log("Email sent successfully!");
      onClose();
    } else {
      console.log("Error sending email");
    }
  };

  const handleBotSubmit = async () => {
    if (!botQuery) return;
    setLoadingBot(true);

    const res = await fetch("http://localhost:3000/api/auth/gmail/send/bot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: botQuery, subject, body }),
    });

    const result = await res.json();
    setSubject(result.subject || subject);
    setBody(result.body || body);
    setLoadingBot(false);
    setShowBotInput(false);
    setBotQuery("");
  };

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isSmallScreen) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (dragging) {
        const newLeft = e.clientX - offset.current.x;
        const newTop = e.clientY - offset.current.y;
        const maxLeft = window.innerWidth - size.width;
        const maxTop = window.innerHeight - size.height;
        setPosition({
          top: Math.min(Math.max(newTop, 0), maxTop),
          left: Math.min(Math.max(newLeft, 0), maxLeft),
        });
      }
      if (resizing) {
        const newWidth = e.clientX - position.left;
        const newHeight = e.clientY - position.top;
        setSize({
          width: Math.max(300, newWidth),
          height: Math.max(300, newHeight),
        });
      }
    };
    const handleMouseUp = () => {
      setDragging(false);
      setResizing(false);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, resizing, position, size, isSmallScreen]);

  const handleDragMouseDown = (e: React.MouseEvent) => {
    if (isSmallScreen) return;
    setDragging(true);
    offset.current = {
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSmallScreen) return;
    setResizing(true);
  };

  const bg = theme === "dark" ? "bg-zinc-900 text-white" : "bg-white text-black";
  const inputBg = theme === "dark" ? "bg-zinc-800" : "bg-gray-100";

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex justify-center items-center p-4">
      <div
        ref={modalRef}
        className={`relative rounded-lg shadow-xl overflow-hidden flex flex-col ${bg} transition-all`}
        style={{
          width: isSmallScreen ? "100%" : size.width,
          height: isSmallScreen ? "100%" : size.height,
          top: isSmallScreen ? undefined : position.top,
          left: isSmallScreen ? undefined : position.left,
          borderRadius: isSmallScreen ? 0 : 8,
        }}
      >
        {!isSmallScreen && (
          <div
            ref={dragHandleRef}
            onMouseDown={handleDragMouseDown}
            className="cursor-move select-none w-full flex justify-center pt-2 pb-1"
          >
            <div className="flex flex-col items-center">
              <div className="w-10 h-1 bg-gray-400 rounded mb-1" />
              <div className="w-10 h-1 bg-gray-400 rounded" />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-700">
          <h2 className="text-md font-medium">New Message</h2>
          <button onClick={()=>savedraft(to,body,subject,userId)}>
            <X className="hover:text-red-500 transition" />
          </button>
        </div>

        <div className="flex-1 px-4 py-3 flex flex-col gap-3 overflow-y-auto">
          <input
            type="email"
            value={fromEmail}
            disabled
            className={`w-full px-4 py-2 rounded-md ${inputBg} text-sm opacity-80 cursor-not-allowed`}
          />
          <input
            type="email"
            placeholder="To"
            className={`w-full px-4 py-2 rounded-md ${inputBg} text-sm focus:outline-none`}
            onChange={(e) => setTo(e.target.value)}
          />
          <input
            type="text"
            placeholder="Subject"
            value={subject}
            className={`w-full px-4 py-2 rounded-md ${inputBg} text-sm focus:outline-none`}
            onChange={(e) => setSubject(e.target.value)}
          />
          <div className="relative flex-1 overflow-hidden">
            <textarea
              placeholder="Write your message..."
              value={body}
              className={`w-full px-4 py-2 rounded-md resize-none ${inputBg} focus:outline-none text-sm pr-20`}
              style={{ height: "100%" }}
              onChange={(e) => setBody(e.target.value)}
            />
            <div
              className="absolute top-2 right-2 flex flex-col items-center cursor-pointer"
              onClick={() => setShowBotInput(!showBotInput)}
            >
              <Lottie animationData={aiMailAnimation} loop autoplay style={{ height: 40 }} />
              <p className="text-[10px] text-gray-400">AI Mitra</p>
            </div>

            {showBotInput && (
              <div className={`absolute top-10 right-2 w-64 p-3 rounded-md shadow-lg ${inputBg} z-50`}>
                <div className="relative">
                  <textarea
                    placeholder="e.g. Fix grammar or write a reply..."
                    value={botQuery}
                    onChange={(e) => setBotQuery(e.target.value)}
                    className="w-full h-20 p-2 text-sm rounded border border-gray-300 focus:outline-none"
                  />
                  <button
                    disabled={loadingBot}
                    onClick={handleBotSubmit}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded float-right"
                  >
                    {loadingBot ? "Thinking..." : "Ask AI"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end px-4 py-3 border-t border-zinc-700">
          <button
            className="px-5 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition"
            onClick={sendMail}
          >
            Send
          </button>
        </div>

        {!isSmallScreen && (
          <div
            ref={resizerRef}
            onMouseDown={handleResizeMouseDown}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize bg-transparent z-10"
          />
        )}
      </div>
    </div>
  );
};

export default ComposeEmailModal;
