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
    <nav className="floating-nav safe-area-bottom" dir="rtl">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === "/" && location.pathname === "/queue");
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-200",
                "min-w-[56px]",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className={cn(
                "relative flex items-center justify-center h-8 w-8 rounded-xl transition-all duration-200",
                isActive && "bg-primary/15"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 transition-transform duration-200",
                  isActive && "scale-110"
                )} />
                {isActive && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
              <span className={cn(
                "text-[10px] font-medium transition-all duration-200",
                isActive ? "font-semibold text-primary" : "text-muted-foreground"
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
