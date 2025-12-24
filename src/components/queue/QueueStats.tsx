import { Users, UserCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueueStatsProps {
  total: number;
  checkedIn: number;
  remaining: number;
}

interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  color: string;
  bgColor: string;
}

function StatCard({ icon: Icon, label, value, color, bgColor }: StatCardProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 rounded-2xl",
      "transition-all duration-200 hover:scale-105",
      bgColor
    )}>
      <div className={cn(
        "flex h-12 w-12 items-center justify-center rounded-xl mb-3",
        color
      )}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-3xl font-bold text-foreground mb-1">{value}</span>
      <span className="text-sm text-muted-foreground font-medium">{label}</span>
    </div>
  );
}

export function QueueStats({ total, checkedIn, remaining }: QueueStatsProps) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <h2 className="text-lg font-semibold text-foreground mb-2">
        إحصائيات اليوم
      </h2>
      
      <div className="flex flex-col gap-4 flex-1">
        <StatCard 
          icon={Users}
          label="إجمالي المرضى"
          value={total}
          color="bg-primary text-primary-foreground"
          bgColor="bg-accent"
        />
        
        <StatCard 
          icon={UserCheck}
          label="تم الحضور"
          value={checkedIn}
          color="bg-success text-success-foreground"
          bgColor="bg-status-arrived-bg"
        />
        
        <StatCard 
          icon={Clock}
          label="المتبقين"
          value={remaining}
          color="bg-warning text-warning-foreground"
          bgColor="bg-secondary"
        />
      </div>
    </div>
  );
}
