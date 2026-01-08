import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Bell, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export type ClinicStatus = "open" | "closed" | "delayed";

const statusConfig: Record<ClinicStatus, { label: string; dotColor: string; bgColor: string }> = {
  open: { 
    label: "متاح الآن", 
    dotColor: "bg-emerald-500",
    bgColor: "bg-emerald-500/10"
  },
  closed: { 
    label: "مغلق", 
    dotColor: "bg-red-500",
    bgColor: "bg-red-500/10"
  },
  delayed: { 
    label: "متأخر", 
    dotColor: "bg-amber-500",
    bgColor: "bg-amber-500/10"
  },
};

export function MobileHeader({ title, showBackButton }: MobileHeaderProps) {
  const navigate = useNavigate();
  const [status] = useState<ClinicStatus>("open");
  const [notificationCount] = useState(3);

  return (
    <header className="sticky top-0 z-50 safe-area-top">
      {/* Glass background */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border/50" />
      
      <div className="relative px-4 py-3">
        <div className="flex items-center justify-between" dir="rtl">
          {/* Left: Back button or Logo */}
          <div className="flex items-center gap-3">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            ) : null}
            
            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-foreground tracking-tight">
                {title || "ClinicOS"}
              </h1>
              {/* Status Indicator */}
              <div className={cn(
                "inline-flex items-center gap-1.5 mt-0.5"
              )}>
                <span className={cn(
                  "relative flex h-2 w-2"
                )}>
                  <span className={cn(
                    "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
                    statusConfig[status].dotColor
                  )} />
                  <span className={cn(
                    "relative inline-flex rounded-full h-2 w-2",
                    statusConfig[status].dotColor
                  )} />
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  {statusConfig[status].label}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="relative h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                  {notificationCount}
                </span>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary"
              onClick={() => navigate('/settings')}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
