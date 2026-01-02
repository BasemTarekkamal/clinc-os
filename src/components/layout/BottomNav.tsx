import { NavLink, useLocation } from "react-router-dom";
import { 
  ClipboardList,
  Users,
  MessageSquare,
  Calendar,
  Wallet
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: ClipboardList, label: "الانتظار", path: "/" },
  { icon: Calendar, label: "التقويم", path: "/calendar" },
  { icon: Users, label: "المرضى", path: "/patients" },
  { icon: MessageSquare, label: "الرسائل", path: "/inbox" },
  { icon: Wallet, label: "المالية", path: "/finances" },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border safe-area-bottom" dir="rtl">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/" && location.pathname === "/queue");
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-8 w-8 rounded-xl transition-all",
                isActive && "bg-primary/10"
              )}>
                <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
              </div>
              <span className={cn(
                "text-[10px] font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
