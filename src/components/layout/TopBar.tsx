import { Clock, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ClinicStatus } from "./AppLayout";

interface TopBarProps {
  clinicName: string;
  status: ClinicStatus;
  onStatusChange: (status: ClinicStatus) => void;
}

const statusConfig: Record<ClinicStatus, { label: string; labelAr: string; color: string }> = {
  open: { 
    label: "Open", 
    labelAr: "مفتوح", 
    color: "bg-success text-success-foreground" 
  },
  closed: { 
    label: "Closed", 
    labelAr: "مغلق", 
    color: "bg-destructive text-destructive-foreground" 
  },
  delayed: { 
    label: "Delayed", 
    labelAr: "متأخر", 
    color: "bg-warning text-warning-foreground" 
  },
};

export function TopBar({ clinicName, status, onStatusChange }: TopBarProps) {
  const currentStatus = statusConfig[status];

  const cycleStatus = () => {
    const statuses: ClinicStatus[] = ["open", "closed", "delayed"];
    const currentIndex = statuses.indexOf(status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    onStatusChange(statuses[nextIndex]);
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-card border-b border-border">
      {/* Clinic Name */}
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-foreground font-arabic">
          {clinicName}
        </h1>
        
        {/* Live Status Toggle */}
        <button
          onClick={cycleStatus}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
            "hover:opacity-90 active:scale-95",
            currentStatus.color
          )}
        >
          <span className="relative flex h-2 w-2">
            <span className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75",
              status === "open" ? "animate-ping bg-current" : ""
            )} />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
          </span>
          <span>{currentStatus.labelAr}</span>
        </button>
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-4">
        {/* Current Time */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">
            {new Date().toLocaleTimeString("ar-EG", { 
              hour: "2-digit", 
              minute: "2-digit" 
            })}
          </span>
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -end-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
            3
          </span>
        </Button>

        {/* User Avatar */}
        <Button variant="ghost" size="icon" className="rounded-full">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <User className="h-4 w-4" />
          </div>
        </Button>
      </div>
    </header>
  );
}
