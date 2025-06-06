import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Settings,
  MessagesSquare,
  Mail,
  CalendarDays, // ✅ Updated calendar icon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/context/ThemeContext"; // ✅ Theme context

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const { theme } = useTheme(); // ✅ Get current theme

  const navItems: NavItem[] = [
    { title: "Summary", icon: Search, path: "/" },
    { title: "WhatsApp", icon: MessagesSquare, path: "/whatsapp/conversation" },
    { title: "Gmail", icon: Mail, path: "/gmail" },
    { title: "Calendar", icon: CalendarDays, path: "/calendar" }, // ✅ Corrected spelling and icon
    { title: "Settings", icon: Settings, path: "/settings" },
  ];

  const isDark = theme === "dark";

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={cn(
          "h-screen flex flex-col border-r z-10 transition-all duration-450 ease-out",
          collapsed ? "w-16" : "w-32",
          isDark ? "bg-[#121216] border-[#1f2937]" : "bg-white border-gray-200" // ✅ Theme-sensitive colors
        )}
      >
        {/* Header */}
        <div className="p-4 flex items-center justify-between">
          {!collapsed && (
            <div
              className={cn(
                "font-bold text-lg transition-colors duration-300",
                isDark ? "text-white" : "text-gray-900" // ✅ Theme-aware text
              )}
            >
              CloudBrief
            </div>
          )}
          {collapsed && <div className="w-8" />}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center p-2 rounded-lg transition-all duration-200",
                          "hover:bg-gray-100 dark:hover:bg-gray-800",
                          isActive
                            ? "bg-blue-600 text-white"
                            : isDark
                            ? "text-gray-300"
                            : "text-gray-700"
                        )
                      }
                    >
                      <item.icon
                        size={20}
                        className={cn("flex-shrink-0", collapsed ? "mx-auto" : "mr-3")}
                      />
                      {!collapsed && (
                        <div className="flex items-center w-full">
                          <span className="flex-1 whitespace-nowrap text-sm">
                            {item.title}
                          </span>
                          {/* {item.badge && (
                            <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                              {item.badge}
                            </span>
                          )} */}
                        </div>
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  {/* {collapsed && <TooltipContent>{item.title}</TooltipContent>} */}
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
