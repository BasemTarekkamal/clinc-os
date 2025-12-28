import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { PatientCard, type Appointment } from "@/components/queue/PatientCard";
import { QueueStats } from "@/components/queue/QueueStats";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Users } from "lucide-react";
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

    // Subscribe to realtime changes
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

  // Helper to ensure a patient record exists for an appointment
  const ensurePatientForAppointment = async (appointment: Appointment): Promise<string | null> => {
    // If patient_id already exists, return it
    if (appointment.patient_id) {
      return appointment.patient_id;
    }

    // Create a new patient record with minimal info
    const { data: newPatient, error: createError } = await supabase
      .from("patients")
      .insert({
        name: appointment.patient_name,
        age: 0, // Unknown age, will display as "غير معروف"
        gender: "male", // Default
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

    // Update the appointment with the new patient_id
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

    // Update local state
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
    // Check if there's already a patient in consultation
    const inConsultation = appointments.find((a) => a.status === "in-consultation");
    
    if (inConsultation) {
      toast({
        title: "تنبيه",
        description: "يوجد مريض آخر في الاستشارة حالياً. يرجى إنهاء الاستشارة الحالية أولاً.",
        variant: "destructive",
      });
      return;
    }

    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    // Ensure patient exists before starting consultation
    const patientId = await ensurePatientForAppointment(appointment);
    if (!patientId) return;
    
    const { error } = await supabase
      .from("appointments")
      .update({ status: "in-consultation" })
      .eq("id", id);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في بدء الاستشارة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم بدء الاستشارة",
      });
      
      // Navigate to patient profile
      navigate(`/patient/${patientId}?consultation=true`);
    }
  };

  // Handler for ensuring patient from PatientCard actions
  const handleEnsurePatient = async (appointmentId: string): Promise<string | null> => {
    const appointment = appointments.find((a) => a.id === appointmentId);
    if (!appointment) return null;
    return ensurePatientForAppointment(appointment);
  };

  // Calculate stats
  const total = appointments.length;
  const checkedIn = appointments.filter(
    (a) => a.status === "arrived" || a.status === "in-consultation"
  ).length;
  const remaining = total - checkedIn;

  return (
    <div className="flex gap-6 h-full" dir="rtl">
      {/* Stats Panel - 30% */}
      <div className="w-[30%] min-w-[280px]">
        <div className="sticky top-0 bg-card rounded-2xl p-6 border shadow-sm">
          <QueueStats total={total} checkedIn={checkedIn} remaining={remaining} />
        </div>
      </div>

      {/* Active Queue List - 70% */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            قائمة الانتظار النشطة
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAppointments}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Users className="h-12 w-12 mb-4" />
            <p className="text-lg">لا توجد مواعيد اليوم</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {appointments.map((appointment) => (
              <PatientCard
                key={appointment.id}
                appointment={appointment}
                onCheckIn={handleCheckIn}
                onSendReminder={handleSendReminder}
                onNoShow={handleNoShow}
                onStartConsultation={handleStartConsultation}
                onEnsurePatient={handleEnsurePatient}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
