import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  MessageSquare, 
  Wallet, 
  ClipboardList,
  ChevronLeft,
  ChevronRight,
  Stethoscope,
  Bot,
  CalendarDays,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navItems = [
  { icon: LayoutDashboard, label: "لوحة التحكم", labelEn: "Dashboard", path: "/dashboard" },
  { icon: ClipboardList, label: "قائمة الانتظار", labelEn: "Live Queue", path: "/queue" },
  { icon: CalendarDays, label: "التقويم", labelEn: "Calendar", path: "/calendar" },
  { icon: Users, label: "المرضى", labelEn: "Patients (EMR)", path: "/patients" },
  { icon: Bot, label: "صندوق الوارد الذكي", labelEn: "Smart Inbox", path: "/inbox" },
  { icon: MessageSquare, label: "الرسائل", labelEn: "Messages", path: "/messages" },
  { icon: Wallet, label: "المالية", labelEn: "Finances", path: "/finances" },
  { icon: Settings, label: "الإعدادات", labelEn: "Settings", path: "/settings" },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();

  return (
    <aside 
      className={cn(
        "flex flex-col bg-card border-e border-border transition-all duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Stethoscope className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-semibold text-foreground">ClinicOS</span>
            <span className="text-xs text-muted-foreground">نظام إدارة العيادات</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/" && location.pathname === "/");
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200",
                "hover:bg-accent hover:text-accent-foreground",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="w-full justify-center"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>
    </aside>
  );
}
