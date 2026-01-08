import { Users, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueStatsProps {
  total: number;
  checkedIn: number;
  remaining: number;
}

interface StatItemProps {
  icon: React.ElementType;
  label: string;
  value: number;
  variant: "primary" | "success" | "warning";
}

function StatItem({ icon: Icon, label, value, variant }: StatItemProps) {
  const variants = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      icon: "text-primary"
    },
    success: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "text-emerald-500"
    },
    warning: {
      bg: "bg-amber-500/10",
      text: "text-amber-600 dark:text-amber-400",
      icon: "text-amber-500"
    }
  };

  const v = variants[variant];

  return (
    <div className="flex flex-col items-center gap-2 flex-1">
      <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", v.bg)}>
        <Icon className={cn("h-5 w-5", v.icon)} />
      </div>
      <div className="text-center">
        <p className={cn("text-2xl font-bold", v.text)}>{value}</p>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
      </div>
    </div>
  );
}

export function QueueStats({ total, checkedIn, remaining }: QueueStatsProps) {
  return (
    <div className="flex items-stretch justify-around gap-4">
      <StatItem 
        icon={Users} 
        label="إجمالي اليوم" 
        value={total} 
        variant="primary" 
      />
      <div className="w-px bg-border/50" />
      <StatItem 
        icon={UserCheck} 
        label="حضروا" 
        value={checkedIn} 
        variant="success" 
      />
      <div className="w-px bg-border/50" />
      <StatItem 
        icon={Clock} 
        label="متبقي" 
        value={remaining} 
        variant="warning" 
      />
    </div>
  );
}
