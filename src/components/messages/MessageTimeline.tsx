import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Circle, Trash2, Star } from "lucide-react";

export interface Message {
  id: string;
  date: string;
  sender: string;
  platform: 'whatsapp' | 'gmail' | 'twitter' | 'linkedin';
  message: string;
  status: 'new' | 'followup' | 'scheduled' | 'read';
  subject?: string;
}

interface MessageTimelineProps {
  messages: Message[];
  title: string;
  icon: React.ReactNode;
}

export function MessageTimeline({ messages, title, icon }: MessageTimelineProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  

  const filteredMessages = messages.filter(message => {
    return (
      !searchTerm ||
      message.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.sender.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4 px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="bg-blue-100 p-1 rounded text-blue-600">
          {icon}
        </div>
        <h1 className="text-lg font-bold">{title}</h1>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search..."
              className="pl-8 py-2 border rounded w-full text-sm text-black"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="text-3xl mb-2">🎉</div>
            <h3 className="text-md font-medium">You're all caught up!</h3>
            <p className="text-gray-400 text-sm">
              No messages to display.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMessages.map((message, index) => (
              <div
                key={`${message.id}`}
                onClick={() => {
                  if (message.platform === 'gmail') {
                    navigate(`/gmail/${message.id}`);
                  }
                }}
                className={`p-2 border rounded hover:shadow-md cursor-pointer transition ${
                  message.status === 'new' ? 'border-green-300 bg-green-50' : 'border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2 flex-1 min-w-0">
                    <div className="mt-1">
                      {message.status === 'new' && (
                        <Circle className="h-2 w-2 text-green-500 animate-pulse" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-1 text-sm">
                        <span className="font-semibold truncate">{message.sender}</span>
                        {message.subject && (
                          <>
                            <span className="text-gray-400">-</span>
                            <span className="text-gray-500 truncate">{message.subject}</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {message.message}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {message.date}
                    </span>
                    <div className="flex gap-1 mt-1">
                      <button 
                        className="text-gray-400 hover:text-red-500 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-yellow-500 transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Star className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
