import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, User, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Appointment {
  id: string;
  patient_name: string;
  scheduled_time: string;
  status: string;
  is_fast_track: boolean;
}

export function AppointmentsCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Working hours: 10 AM to 8 PM
  const workingHours = Array.from({ length: 11 }, (_, i) => i + 10);

  const fetchAppointments = async () => {
    setLoading(true);
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('scheduled_time', startOfDay.toISOString())
      .lte('scheduled_time', endOfDay.toISOString())
      .order('scheduled_time', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
    } else {
      setAppointments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel('calendar-appointments')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'appointments' },
        () => fetchAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate]);

  const appointmentsByHour = useMemo(() => {
    const grouped: Record<number, Appointment[]> = {};
    workingHours.forEach(hour => grouped[hour] = []);
    
    appointments.forEach(apt => {
      const aptDate = new Date(apt.scheduled_time);
      const hour = aptDate.getHours();
      if (grouped[hour]) {
        grouped[hour].push(apt);
      }
    });
    
    return grouped;
  }, [appointments]);

  const goToPreviousDay = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);
    setCurrentDate(prev);
  };

  const goToNextDay = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return currentDate.toDateString() === today.toDateString();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'م' : 'ص';
    const displayHour = hour > 12 ? hour - 12 : hour;
    return `${displayHour}:00 ${period}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300';
      case 'arrived':
        return 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300';
      case 'in-consultation':
        return 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300';
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'booked': return 'محجوز';
      case 'arrived': return 'وصل';
      case 'in-consultation': return 'في الكشف';
      case 'completed': return 'انتهى';
      default: return status;
    }
  };

  const currentHour = new Date().getHours();

  return (
    <div className="flex flex-col h-full bg-card rounded-xl border" dir="rtl">
      {/* Header - Compact for mobile */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="h-9 w-9">
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={goToNextDay} className="h-9 w-9">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {!isToday() && (
              <Button variant="outline" size="sm" onClick={goToToday} className="h-8 text-xs">
                اليوم
              </Button>
            )}
            <Badge variant="secondary" className="gap-1 h-7">
              <Clock className="h-3 w-3" />
              {appointments.length}
            </Badge>
          </div>
        </div>
        <h2 className="text-base font-semibold text-center">{formatDate(currentDate)}</h2>
      </div>

      {/* Calendar Grid - Vertical scrolling */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="divide-y">
            {workingHours.map(hour => {
              const hourAppointments = appointmentsByHour[hour] || [];
              const isCurrentHour = isToday() && hour === currentHour;
              
              return (
                <div
                  key={hour}
                  className={cn(
                    "flex gap-3 p-3 transition-colors",
                    isCurrentHour && "bg-primary/5"
                  )}
                >
                  {/* Time Label */}
                  <div className="w-16 shrink-0">
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrentHour ? "text-primary" : "text-muted-foreground"
                    )}>
                      {formatHour(hour)}
                    </span>
                    {isCurrentHour && (
                      <div className="text-[10px] text-primary font-medium">الآن</div>
                    )}
                  </div>

                  {/* Appointments */}
                  <div className="flex-1 min-h-[2.5rem]">
                    {hourAppointments.length === 0 ? (
                      <div className="h-full flex items-center">
                        <span className="text-xs text-muted-foreground/50">—</span>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hourAppointments.map(apt => (
                          <div
                            key={apt.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border",
                              getStatusColor(apt.status)
                            )}
                          >
                            <User className="h-4 w-4 shrink-0 opacity-70" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {apt.patient_name}
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] opacity-80">
                                <span>{getStatusLabel(apt.status)}</span>
                                {apt.is_fast_track && (
                                  <span className="flex items-center gap-0.5">
                                    <Zap className="h-2.5 w-2.5" />
                                    سريع
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend - Compact */}
      <div className="p-3 border-t">
        <div className="flex flex-wrap gap-3 justify-center text-[10px]">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-blue-500/50" />
            <span>محجوز</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-amber-500/50" />
            <span>وصل</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-purple-500/50" />
            <span>كشف</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded bg-green-500/50" />
            <span>انتهى</span>
          </div>
        </div>
      </div>
    </div>
  );
}
