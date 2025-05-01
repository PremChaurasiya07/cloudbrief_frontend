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
  Twitter,
  Linkedin
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  icon: React.ElementType;
  path: string;
  badge?: number;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);

  const navItems: NavItem[] = [
    { title: "Summary", icon: Search, path: "/" },
    { title: "WhatsApp", icon: MessagesSquare, path: "/whatsapp/conversation", badge: 3 },
    { title: "Gmail", icon: Mail, path: "/gmail", badge: 5 },
    { title: "Twitter", icon: Twitter, path: "/twitter", badge: 2 },
    { title: "LinkedIn", icon: Linkedin, path: "/linkedin" },
    { title: "Settings", icon: Settings, path: "/settings" },
  ];

  return (
    <TooltipProvider delayDuration={0}>
      <aside onMouseEnter={() => setCollapsed(false)} onMouseLeave={() => setCollapsed(true)}
        className={cn(
          "bg-sidebar h-screen flex flex-col border-r z-10 border-sidebar-border transition-all duration-450 ease-out",
          collapsed ? "w-16" : "w-32"
        )}
      >
        <div className="p-4 flex items-center justify-between">
          {!collapsed && (
            <div className="font-bold text-lg text-sidebar-foreground">
              CloudBrief OS
            </div>
          )}
          {collapsed && <div className="w-8" />}
          {/* <Button
            variant="ghost"
            size="icon"
            // onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </Button> */}
        </div>
        
        <nav className="flex-1 py-4 overflow-y-auto scrollbar-hide">
          <ul className="space-y-2 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) => cn(
                        "flex items-center p-2 rounded-lg transition-all duration-200",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground glow-effect"
                          : "text-sidebar-foreground"
                      )}
                    >
                      <item.icon
                        size={20}
                        className={cn("flex-shrink-0", collapsed ? "mx-auto" : "mr-3")}
                      />
                      {/* Render title and badge only if the sidebar is not collapsed */}
                      {!collapsed && (
                        <div className="flex items-center w-full">
                          <span className="flex-1 whitespace-nowrap text-sm">{item.title}</span>
                          {item.badge && (
                            <span className="ml-auto inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-primary text-primary-foreground">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </TooltipTrigger>
                  {/* Tooltip for collapsed state */}
                  {/*  */}
                </Tooltip>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex justify-center">
            <ThemeToggle />
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}
