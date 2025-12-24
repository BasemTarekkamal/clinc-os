import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface CompletedAppointment {
  id: string;
  patient_name: string;
  patient_id: string | null;
  scheduled_time: string;
  updated_at: string;
  is_fast_track: boolean;
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
  const navigate = useNavigate();
  const [completedAppointments, setCompletedAppointments] = useState<CompletedAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalToday: 0,
    completed: 0,
    noShow: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    
    // Fetch completed appointments
    const { data: completed, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("status", "completed")
      .order("updated_at", { ascending: false })
      .limit(10);

    if (!error && completed) {
      setCompletedAppointments(completed as CompletedAppointment[]);
    }

    // Fetch stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { data: allToday } = await supabase
      .from("appointments")
      .select("status")
      .gte("scheduled_time", today.toISOString());

    if (allToday) {
      setStats({
        totalToday: allToday.length,
        completed: allToday.filter((a) => a.status === "completed").length,
        noShow: allToday.filter((a) => a.status === "no-show").length,
      });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const attendanceRate = stats.totalToday > 0 
    ? Math.round(((stats.totalToday - stats.noShow) / stats.totalToday) * 100) 
    : 100;

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              لوحة التحكم
            </h1>
            <p className="text-muted-foreground">
              مرحباً بك في نظام إدارة العيادة
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="إجمالي المرضى اليوم"
            value={String(stats.totalToday)}
            change={12}
            icon={Users}
          />
          <StatCard 
            title="المواعيد المكتملة"
            value={String(stats.completed)}
            change={8}
            icon={Calendar}
          />
          <StatCard 
            title="لم يحضروا"
            value={String(stats.noShow)}
            change={stats.noShow > 0 ? -stats.noShow : 0}
            icon={Clock}
          />
          <StatCard 
            title="معدل الحضور"
            value={`${attendanceRate}%`}
            change={3}
            icon={TrendingUp}
          />
        </div>

        {/* Completed Appointments Section */}
        <div className="bg-card rounded-2xl border shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">الاستشارات المكتملة</h2>
                <p className="text-sm text-muted-foreground">آخر 10 استشارات تم إنهاؤها</p>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : completedAppointments.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">لا توجد استشارات مكتملة حتى الآن</p>
            </div>
          ) : (
            <div className="divide-y">
              {completedAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => appointment.patient_id && navigate(`/patient/${appointment.patient_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                        {appointment.patient_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{appointment.patient_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appointment.scheduled_time), "dd MMMM yyyy - hh:mm a", { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {appointment.is_fast_track && (
                        <Badge variant="secondary" className="text-xs">سريع</Badge>
                      )}
                      <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                        <CheckCircle className="h-3 w-3 me-1" />
                        مكتمل
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
