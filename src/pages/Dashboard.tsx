import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, change, icon: Icon }: StatCardProps) {
  const isPositive = change >= 0;
  
  return (
    <div className="bg-card rounded-2xl p-6 border shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
          <Icon className="h-6 w-6 text-primary" />
        </div>
      </div>
      <div className={cn(
        "flex items-center gap-1 mt-4 text-sm font-medium",
        isPositive ? "text-success" : "text-destructive"
      )}>
        {isPositive ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <ArrowDownRight className="h-4 w-4" />
        )}
        <span>{Math.abs(change)}% من الأسبوع الماضي</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            لوحة التحكم
          </h1>
          <p className="text-muted-foreground">
            مرحباً بك في نظام إدارة العيادة
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="إجمالي المرضى اليوم"
            value="24"
            change={12}
            icon={Users}
          />
          <StatCard 
            title="المواعيد المكتملة"
            value="18"
            change={8}
            icon={Calendar}
          />
          <StatCard 
            title="متوسط وقت الانتظار"
            value="15 دقيقة"
            change={-5}
            icon={Clock}
          />
          <StatCard 
            title="معدل الحضور"
            value="92%"
            change={3}
            icon={TrendingUp}
          />
        </div>

        {/* Coming Soon Placeholder */}
        <div className="bg-card rounded-2xl p-12 border text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              التقارير والإحصائيات المتقدمة
            </h3>
            <p className="text-muted-foreground max-w-md">
              سيتم إضافة المزيد من التقارير والرسوم البيانية في التحديثات القادمة
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
