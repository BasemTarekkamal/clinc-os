import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PatientCard, type Appointment } from "@/components/queue/PatientCard";
import { QueueStats } from "@/components/queue/QueueStats";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LiveQueue() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .neq("status", "no-show")
      .neq("status", "completed")
      .order("scheduled_time", { ascending: true });

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل المواعيد",
        variant: "destructive",
      });
      console.error("Error fetching appointments:", error);
    } else {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAppointments();

    const channel = supabase
      .channel("appointments-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "appointments",
        },
        () => {
          fetchAppointments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  const ensurePatientForAppointment = async (appointment: Appointment): Promise<string | null> => {
    if (appointment.patient_id) {
      return appointment.patient_id;
    }

    const { data: newPatient, error: createError } = await supabase
      .from("patients")
      .insert({
        name: appointment.patient_name,
        age: 0,
        gender: "male",
      })
      .select()
      .single();

    if (createError || !newPatient) {
      console.error("Error creating patient:", createError);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء ملف المريض",
        variant: "destructive",
      });
      return null;
    }

    const { error: updateError } = await supabase
      .from("appointments")
      .update({ patient_id: newPatient.id })
      .eq("id", appointment.id);

    if (updateError) {
      console.error("Error updating appointment:", updateError);
      toast({
        title: "خطأ",
        description: "فشل في ربط ملف المريض",
        variant: "destructive",
      });
      return null;
    }

    setAppointments((prev) =>
      prev.map((a) =>
        a.id === appointment.id ? { ...a, patient_id: newPatient.id } : a
      )
    );

    return newPatient.id;
  };

  const handleCheckIn = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ 
        status: "arrived", 
        arrival_time: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تسجيل الحضور",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم تسجيل حضور المريض",
      });
    }
  };

  const handleSendReminder = async (id: string) => {
    const appointment = appointments.find((a) => a.id === id);
    toast({
      title: "تم الإرسال",
      description: `تم إرسال تذكير إلى ${appointment?.patient_name} عبر واتساب`,
    });
  };

  const handleNoShow = async (id: string) => {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "no-show" })
      .eq("id", id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في تحديث الحالة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم التحديث",
        description: "تم تسجيل عدم الحضور",
      });
    }
  };

  const handleStartConsultation = async (id: string) => {
    const inConsultation = appointments.find((a) => a.status === "in-consultation");
    
    if (inConsultation) {
      toast({
        title: "تنبيه",
        description: "يوجد مريض آخر في الكشف حالياً. يرجى إنهاء الكشف الحالي أولاً.",
        variant: "destructive",
      });
      return;
    }

    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    const patientId = await ensurePatientForAppointment(appointment);
    if (!patientId) return;
    
    const { error } = await supabase
      .from("appointments")
      .update({ status: "in-consultation" })
      .eq("id", id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في بدء الكشف",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم بدء الكشف",
      });
      
      navigate(`/patient/${patientId}?consultation=true`);
    }
  };

  const handleEnsurePatient = async (appointmentId: string): Promise<string | null> => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return null;
    return ensurePatientForAppointment(appointment);
  };

  const total = appointments.length;
  const checkedIn = appointments.filter(
    (a) => a.status === "arrived" || a.status === "in-consultation"
  ).length;
  const remaining = total - checkedIn;

  return (
    <MobileLayout title="قائمة الانتظار">
      <div className="space-y-5" dir="rtl">
        {/* Stats Card */}
        <div className="glass-card p-5">
          <QueueStats total={total} checkedIn={checkedIn} remaining={remaining} />
        </div>

        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            المواعيد النشطة
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchAppointments}
              disabled={loading}
              className="h-9 w-9 rounded-xl"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button
              size="sm"
              className="h-9 gap-1.5 rounded-xl"
            >
              <Plus className="h-4 w-4" />
              <span>موعد جديد</span>
            </Button>
          </div>
        </div>

        {/* Appointments List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">جاري التحميل...</p>
            </div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">لا توجد مواعيد</h3>
            <p className="text-sm text-muted-foreground">لم يتم حجز أي مواعيد لهذا اليوم</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {appointments.map((appointment, index) => (
              <div 
                key={appointment.id}
                className="slide-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <PatientCard
                  appointment={appointment}
                  onCheckIn={handleCheckIn}
                  onSendReminder={handleSendReminder}
                  onNoShow={handleNoShow}
                  onStartConsultation={handleStartConsultation}
                  onEnsurePatient={handleEnsurePatient}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
