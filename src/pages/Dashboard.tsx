import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/layout/MobileLayout";
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
    <div className="bg-card rounded-2xl p-4 border shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium",
          isPositive ? "text-success" : "text-destructive"
        )}>
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          <span>{Math.abs(change)}%</span>
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{title}</p>
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
    <MobileLayout title="لوحة التحكم">
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">مرحباً بك</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="h-9 w-9"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Stats Grid - 2x2 on mobile */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            title="إجمالي المرضى"
            value={String(stats.totalToday)}
            change={12}
            icon={Users}
          />
          <StatCard 
            title="المكتملة"
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
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-100">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">الاستشارات المكتملة</h2>
                <p className="text-xs text-muted-foreground">آخر 10 استشارات</p>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : completedAppointments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm text-muted-foreground">لا توجد استشارات مكتملة</p>
            </div>
          ) : (
            <div className="divide-y max-h-[300px] overflow-y-auto">
              {completedAppointments.map((appointment) => (
                <div 
                  key={appointment.id}
                  className="p-3 active:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => appointment.patient_id && navigate(`/patient/${appointment.patient_id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {appointment.patient_name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{appointment.patient_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(appointment.scheduled_time), "dd MMM - hh:mm a", { locale: ar })}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 text-xs">
                      <CheckCircle className="h-3 w-3 me-1" />
                      مكتمل
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
}
