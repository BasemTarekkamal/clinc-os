import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
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
  const workingHours = Array.from({ length: 11 }, (_, i) => i + 10); // 10, 11, 12, ..., 20

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

    // Subscribe to realtime updates
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
      year: 'numeric',
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
        return 'bg-blue-500/20 border-blue-500 text-blue-700 dark:text-blue-300';
      case 'arrived':
        return 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300';
      case 'in-consultation':
        return 'bg-purple-500/20 border-purple-500 text-purple-700 dark:text-purple-300';
      case 'completed':
        return 'bg-green-500/20 border-green-500 text-green-700 dark:text-green-300';
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
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={goToPreviousDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">{formatDate(currentDate)}</h2>
        </div>
        <div className="flex items-center gap-2">
          {!isToday() && (
            <Button variant="outline" size="sm" onClick={goToToday}>
              اليوم
            </Button>
          )}
          <Badge variant="secondary" className="gap-1">
            <Clock className="h-3 w-3" />
            {appointments.length} موعد
          </Badge>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="space-y-2">
            {workingHours.map(hour => {
              const hourAppointments = appointmentsByHour[hour] || [];
              const isCurrentHour = isToday() && hour === currentHour;
              
              return (
                <div
                  key={hour}
                  className={cn(
                    "flex gap-4 p-3 rounded-lg transition-colors",
                    isCurrentHour ? "bg-primary/10 ring-2 ring-primary" : "hover:bg-muted/50"
                  )}
                >
                  {/* Time Label */}
                  <div className="w-20 shrink-0 text-left">
                    <span className={cn(
                      "text-sm font-medium",
                      isCurrentHour ? "text-primary" : "text-muted-foreground"
                    )}>
                      {formatHour(hour)}
                    </span>
                    {isCurrentHour && (
                      <div className="text-xs text-primary mt-1">الآن</div>
                    )}
                  </div>

                  {/* Appointments */}
                  <div className="flex-1 min-h-[3rem]">
                    {hourAppointments.length === 0 ? (
                      <div className="h-full flex items-center">
                        <span className="text-xs text-muted-foreground">—</span>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {hourAppointments.map(apt => (
                          <div
                            key={apt.id}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 rounded-lg border",
                              getStatusColor(apt.status)
                            )}
                          >
                            <User className="h-4 w-4 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">
                                {apt.patient_name}
                              </div>
                              <div className="flex items-center gap-2 text-xs">
                                <span>{getStatusLabel(apt.status)}</span>
                                {apt.is_fast_track && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0">
                                    سريع ⚡
                                  </Badge>
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

      {/* Legend */}
      <div className="p-4 border-t">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500/50" />
            <span>محجوز</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500/50" />
            <span>وصل</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-purple-500/50" />
            <span>في الكشف</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/50" />
            <span>انتهى</span>
          </div>
        </div>
      </div>
    </div>
  );
}
