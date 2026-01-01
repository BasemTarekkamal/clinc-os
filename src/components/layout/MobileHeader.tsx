import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MobileHeaderProps {
  title?: string;
  showBackButton?: boolean;
}

export type ClinicStatus = "open" | "closed" | "delayed";

const statusConfig: Record<ClinicStatus, { label: string; color: string }> = {
  open: { label: "مفتوح", color: "bg-green-500" },
  closed: { label: "مغلق", color: "bg-red-500" },
  delayed: { label: "متأخر", color: "bg-amber-500" },
};

export function MobileHeader({ title, showBackButton }: MobileHeaderProps) {
  const navigate = useNavigate();
  const [status] = useState<ClinicStatus>("open");

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between" dir="rtl">
        <div className="flex items-center gap-3">
          {showBackButton && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="h-10 w-10"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {title || "ClinicOS"}
            </h1>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${statusConfig[status].color}`} />
              <span className="text-xs text-muted-foreground">
                {statusConfig[status].label}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative h-10 w-10">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -end-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              3
            </Badge>
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
