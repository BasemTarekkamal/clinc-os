import { Banknote, Smartphone, CreditCard, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  variant?: "primary" | "success" | "warning" | "info";
}

function SummaryCard({ title, value, subtitle, icon: Icon, variant = "primary" }: SummaryCardProps) {
  const variantStyles = {
    primary: "bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20",
    success: "bg-gradient-to-br from-success/20 to-success/5 border-success/20",
    warning: "bg-gradient-to-br from-warning/20 to-warning/5 border-warning/20",
    info: "bg-gradient-to-br from-accent/20 to-accent/5 border-accent/20",
  };

  const iconStyles = {
    primary: "text-primary",
    success: "text-success",
    warning: "text-warning",
    info: "text-accent",
  };

  return (
    <div className={cn(
      "rounded-xl p-4 border backdrop-blur-sm",
      variantStyles[variant]
    )}>
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-background/50",
          iconStyles[variant]
        )}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p className="text-lg font-bold text-foreground">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function RevenueSummary() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <SummaryCard
        title="إجمالي اليوم"
        value="3,000 ج.م"
        subtitle="8 معاملات"
        icon={TrendingUp}
        variant="primary"
      />
      <SummaryCard
        title="النقدي"
        value="1,100 ج.م"
        subtitle="4 معاملات"
        icon={Banknote}
        variant="success"
      />
      <SummaryCard
        title="InstaPay"
        value="900 ج.م"
        subtitle="2 معلق"
        icon={Smartphone}
        variant="warning"
      />
      <SummaryCard
        title="بطاقات"
        value="700 ج.م"
        subtitle="2 معاملات"
        icon={CreditCard}
        variant="info"
      />
    </div>
  );
}
