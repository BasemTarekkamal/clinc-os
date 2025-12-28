import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { supabase } from "@/integrations/supabase/client";
import { format, isSameDay, parseISO, startOfDay, endOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, User, AlertCircle } from "lucide-react";

interface Appointment {
  id: string;
  patient_name: string;
  scheduled_time: string;
  status: string;
  is_fast_track: boolean;
}

export function AppointmentCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all appointments for calendar dots
  useEffect(() => {
    const fetchAllAppointments = async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .order("scheduled_time", { ascending: true });

      if (data) {
        setAllAppointments(data as Appointment[]);
      }
    };

    fetchAllAppointments();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("calendar-appointments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "appointments" },
        () => fetchAllAppointments()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch appointments for selected date
  useEffect(() => {
    const fetchDayAppointments = async () => {
      setLoading(true);
      const dayStart = startOfDay(selectedDate);
      const dayEnd = endOfDay(selectedDate);

      const { data } = await supabase
        .from("appointments")
        .select("*")
        .gte("scheduled_time", dayStart.toISOString())
        .lte("scheduled_time", dayEnd.toISOString())
        .order("scheduled_time", { ascending: true });

      if (data) {
        setAppointments(data as Appointment[]);
      }
      setLoading(false);
    };

    fetchDayAppointments();
  }, [selectedDate]);

  // Get dates that have appointments
  const datesWithAppointments = allAppointments.reduce((acc, apt) => {
    const date = format(parseISO(apt.scheduled_time), "yyyy-MM-dd");
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "booked":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "arrived":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "in-consultation":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "completed":
        return "bg-muted text-muted-foreground border-muted";
      case "no-show":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "booked":
        return "محجوز";
      case "arrived":
        return "وصل";
      case "in-consultation":
        return "في الكشف";
      case "completed":
        return "مكتمل";
      case "no-show":
        return "لم يحضر";
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6" dir="rtl">
      {/* Calendar */}
      <div className="bg-card rounded-2xl p-4 border shadow-sm">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          locale={ar}
          className="pointer-events-auto"
          modifiers={{
            hasAppointments: (date) =>
              datesWithAppointments[format(date, "yyyy-MM-dd")] > 0,
          }}
          modifiersStyles={{
            hasAppointments: {
              fontWeight: "bold",
              textDecoration: "underline",
              textDecorationColor: "hsl(var(--primary))",
              textUnderlineOffset: "4px",
            },
          }}
        />
      </div>

      {/* Day Schedule */}
      <div className="flex-1 bg-card rounded-2xl p-6 border shadow-sm min-w-[300px]">
        <h3 className="text-lg font-semibold mb-4">
          مواعيد {format(selectedDate, "EEEE d MMMM", { locale: ar })}
        </h3>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <AlertCircle className="h-10 w-10 mb-3" />
            <p>لا توجد مواعيد في هذا اليوم</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`p-4 rounded-xl border transition-colors ${getStatusColor(apt.status)}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{apt.patient_name}</span>
                        {apt.is_fast_track && (
                          <Badge variant="secondary" className="text-xs">
                            سريع
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm opacity-80">
                        <Clock className="h-3.5 w-3.5" />
                        <span>
                          {format(parseISO(apt.scheduled_time), "hh:mm a", {
                            locale: ar,
                          })}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0">
                      {getStatusLabel(apt.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
