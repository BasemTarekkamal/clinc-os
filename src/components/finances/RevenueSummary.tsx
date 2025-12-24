import { Wallet, Banknote, Smartphone, CreditCard, TrendingUp } from "lucide-react";
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
    primary: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
    success: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]",
    warning: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]",
    info: "bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]",
  };

  const iconBgStyles = {
    primary: "bg-[hsl(var(--primary-foreground)/0.2)]",
    success: "bg-[hsl(var(--success-foreground)/0.2)]",
    warning: "bg-[hsl(var(--warning-foreground)/0.2)]",
    info: "bg-[hsl(var(--accent-foreground)/0.2)]",
  };

  return (
    <div className={cn("rounded-2xl p-6 transition-all duration-200", variantStyles[variant])}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm opacity-90 mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm opacity-75 mt-2">{subtitle}</p>
          )}
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl", iconBgStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

export function RevenueSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <SummaryCard
        title="إجمالي الإيرادات اليوم"
        value="3,000 ج.م"
        subtitle="8 معاملات"
        icon={TrendingUp}
        variant="primary"
      />
      <SummaryCard
        title="النقدي في الصندوق"
        value="1,100 ج.م"
        subtitle="4 معاملات"
        icon={Banknote}
        variant="success"
      />
      <SummaryCard
        title="InstaPay (معلق)"
        value="900 ج.م"
        subtitle="2 معاملات معلقة"
        icon={Smartphone}
        variant="warning"
      />
      <SummaryCard
        title="بطاقات الدفع"
        value="700 ج.م"
        subtitle="2 معاملات"
        icon={CreditCard}
        variant="info"
      />
    </div>
  );
}
