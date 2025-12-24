import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Stethoscope, RefreshCw, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { PatientInfo, type Patient } from "@/components/emr/PatientInfo";
import { VisitTimeline, type Visit } from "@/components/emr/VisitTimeline";
import { ConsultationOverlay, type ConsultationData } from "@/components/emr/ConsultationOverlay";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function PatientProfile() {
  const { patientId } = useParams<{ patientId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConsultation, setShowConsultation] = useState(false);
  const [isInActiveConsultation, setIsInActiveConsultation] = useState(false);
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  const fetchPatientData = async () => {
    if (!patientId) return;

    setLoading(true);
    
    // Fetch patient
    const { data: patientData, error: patientError } = await supabase
      .from("patients")
      .select("*")
      .eq("id", patientId)
      .maybeSingle();

    if (patientError) {
      console.error("Error fetching patient:", patientError);
      toast({
        title: "خطأ",
        description: "فشل في تحميل بيانات المريض",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (patientData) {
      setPatient(patientData as Patient);
    }

    // Check if patient has an active consultation
    const { data: appointmentData } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientId)
      .eq("status", "in-consultation")
      .maybeSingle();

    if (appointmentData) {
      setIsInActiveConsultation(true);
      setActiveAppointmentId(appointmentData.id);
    } else {
      setIsInActiveConsultation(false);
      setActiveAppointmentId(null);
    }

    // Fetch visits with prescriptions
    const { data: visitsData, error: visitsError } = await supabase
      .from("visits")
      .select(`
        *,
        prescriptions (*)
      `)
      .eq("patient_id", patientId)
      .order("visit_date", { ascending: false });

    if (visitsError) {
      console.error("Error fetching visits:", visitsError);
    } else {
      setVisits(visitsData as Visit[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchPatientData();
    
    // Check if we should open consultation from query param
    if (searchParams.get("consultation") === "true") {
      setShowConsultation(true);
    }
  }, [patientId, searchParams]);

  const handleEndConsultation = async () => {
    if (!activeAppointmentId) return;

    const { error } = await supabase
      .from("appointments")
      .update({ status: "completed" })
      .eq("id", activeAppointmentId);

    if (error) {
      toast({
        title: "خطأ",
        description: "فشل في إنهاء الاستشارة",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تم إنهاء الاستشارة. المريض التالي في الانتظار.",
      });
      setIsInActiveConsultation(false);
      setActiveAppointmentId(null);
      navigate("/queue");
    }
  };

  const handleSaveConsultation = async (data: ConsultationData) => {
    if (!patient) return;

    try {
      // Create visit
      const { data: visitData, error: visitError } = await supabase
        .from("visits")
        .insert({
          patient_id: patient.id,
          chief_complaint: data.chiefComplaint,
          diagnosis: data.diagnosis,
          notes: data.notes,
          bp_systolic: data.vitals.bpSystolic ? parseInt(data.vitals.bpSystolic) : null,
          bp_diastolic: data.vitals.bpDiastolic ? parseInt(data.vitals.bpDiastolic) : null,
          weight: data.vitals.weight ? parseFloat(data.vitals.weight) : null,
          temperature: data.vitals.temperature ? parseFloat(data.vitals.temperature) : null,
          heart_rate: data.vitals.heartRate ? parseInt(data.vitals.heartRate) : null,
          status: "completed",
        })
        .select()
        .single();

      if (visitError) throw visitError;

      // Create prescriptions
      if (data.prescriptions.length > 0 && visitData) {
        const prescriptionsToInsert = data.prescriptions.map(p => ({
          visit_id: visitData.id,
          drug_name: p.drugName,
          drug_name_ar: p.drugNameAr,
          dosage: p.dosage,
          frequency: p.frequency,
          duration: p.duration,
        }));

        const { error: prescError } = await supabase
          .from("prescriptions")
          .insert(prescriptionsToInsert);

        if (prescError) throw prescError;
      }

      // Save medical files references
      if (data.files.length > 0 && visitData) {
        const filesToInsert = data.files.map(f => ({
          patient_id: patient.id,
          visit_id: visitData.id,
          file_name: f.name,
          file_url: f.url,
          file_type: f.type,
          file_size: f.size,
          category: "lab-result" as const,
        }));

        const { error: filesError } = await supabase
          .from("medical_files")
          .insert(filesToInsert);

        if (filesError) throw filesError;
      }

      toast({
        title: "تم بنجاح",
        description: "تم حفظ الزيارة بنجاح",
      });

      setShowConsultation(false);
      fetchPatientData();
    } catch (error) {
      console.error("Error saving consultation:", error);
      toast({
        title: "خطأ",
        description: "فشل في حفظ الزيارة",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!patient) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-full text-center" dir="rtl">
          <p className="text-lg text-muted-foreground mb-4">لم يتم العثور على المريض</p>
          <Button onClick={() => navigate("/queue")}>
            العودة للقائمة
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/queue")}
              className="rounded-full"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">ملف المريض</h1>
              <p className="text-muted-foreground">عرض السجل الطبي الكامل</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isInActiveConsultation && (
              <Button 
                onClick={handleEndConsultation}
                variant="outline"
                className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
                size="lg"
              >
                <CheckCircle className="h-5 w-5" />
                <span>إنهاء الاستشارة</span>
              </Button>
            )}
            <Button 
              onClick={() => setShowConsultation(true)}
              className="gap-2"
              size="lg"
            >
              <Stethoscope className="h-5 w-5" />
              <span>بدء استشارة</span>
            </Button>
          </div>
        </div>

        {/* Active Consultation Banner */}
        {isInActiveConsultation && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-700 font-medium">هذا المريض في استشارة نشطة حالياً</span>
            </div>
          </div>
        )}

        {/* Split View */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info (30%) */}
          <div className="lg:col-span-1">
            <PatientInfo patient={patient} />
          </div>

          {/* Right Column - Timeline (70%) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">سجل الزيارات</h2>
            <VisitTimeline visits={visits} />
          </div>
        </div>

        {/* Consultation Overlay */}
        <ConsultationOverlay
          patient={patient}
          isOpen={showConsultation}
          onClose={() => setShowConsultation(false)}
          onSave={handleSaveConsultation}
        />
      </div>
    </AppLayout>
  );
}
