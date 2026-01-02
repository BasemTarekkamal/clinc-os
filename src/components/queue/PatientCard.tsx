import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  CheckCircle, 
  MessageCircle, 
  XCircle, 
  Clock,
  Zap,
  User,
  Stethoscope,
  ChevronLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export type AppointmentStatus = "booked" | "arrived" | "in-consultation" | "late" | "no-show";

export interface Appointment {
  id: string;
  patient_name: string;
  patient_photo?: string;
  patient_id?: string;
  status: AppointmentStatus;
  scheduled_time: string;
  is_fast_track: boolean;
  arrival_time?: string;
}

interface PatientCardProps {
  appointment: Appointment;
  onCheckIn: (id: string) => void;
  onSendReminder: (id: string) => void;
  onNoShow: (id: string) => void;
  onStartConsultation?: (id: string) => void;
  onEnsurePatient?: (appointmentId: string) => Promise<string | null>;
}

const statusConfig: Record<AppointmentStatus, { 
  label: string; 
  labelAr: string; 
  bgClass: string; 
  textClass: string;
  borderClass?: string;
}> = {
  booked: { 
    label: "Booked", 
    labelAr: "محجوز", 
    bgClass: "bg-status-booked-bg",
    textClass: "text-status-booked"
  },
  arrived: { 
    label: "Arrived", 
    labelAr: "وصل", 
    bgClass: "bg-status-arrived-bg",
    textClass: "text-status-arrived"
  },
  "in-consultation": { 
    label: "In Consultation", 
    labelAr: "في الاستشارة", 
    bgClass: "bg-status-consultation-bg",
    textClass: "text-status-consultation",
    borderClass: "pulse-border border-2 border-primary"
  },
  late: { 
    label: "Late / Risk", 
    labelAr: "متأخر", 
    bgClass: "bg-status-late-bg",
    textClass: "text-status-late"
  },
  "no-show": { 
    label: "No Show", 
    labelAr: "لم يحضر", 
    bgClass: "bg-status-noshow-bg",
    textClass: "text-status-noshow"
  },
};

export function PatientCard({ 
  appointment, 
  onCheckIn, 
  onSendReminder, 
  onNoShow,
  onStartConsultation,
  onEnsurePatient
}: PatientCardProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();
  const status = statusConfig[appointment.status];

  const handleNoShow = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExiting(true);
    setTimeout(() => {
      onNoShow(appointment.id);
    }, 500);
  };

  const handleOpenProfile = async () => {
    if (isProcessing) return;
    
    // If patient_id exists, navigate directly
    if (appointment.patient_id) {
      navigate(`/patient/${appointment.patient_id}`);
      return;
    }

    // Otherwise, ensure patient exists first
    if (onEnsurePatient) {
      setIsProcessing(true);
      const patientId = await onEnsurePatient(appointment.id);
      setIsProcessing(false);
      if (patientId) {
        navigate(`/patient/${patientId}`);
      }
    }
  };

  const handleStartConsultation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartConsultation) {
      onStartConsultation(appointment.id);
    }
  };

  const handleContinueConsultation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isProcessing) return;
    
    if (appointment.patient_id) {
      navigate(`/patient/${appointment.patient_id}?consultation=true`);
      return;
    }

    if (onEnsurePatient) {
      setIsProcessing(true);
      const patientId = await onEnsurePatient(appointment.id);
      setIsProcessing(false);
      if (patientId) {
        navigate(`/patient/${patientId}?consultation=true`);
      }
    }
  };

  const formattedTime = format(
    new Date(appointment.scheduled_time), 
    "hh:mm a", 
    { locale: ar }
  );

  return (
    <div 
      className={cn(
        "relative rounded-xl bg-card border transition-all duration-300",
        "active:scale-[0.98] cursor-pointer",
        status.borderClass,
        isExiting && "opacity-0 -translate-x-full",
        isProcessing && "opacity-70 pointer-events-none"
      )}
      onClick={handleOpenProfile}
    >
      {/* Fast Track Badge */}
      {appointment.is_fast_track && (
        <div className="absolute -top-2 -end-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning text-warning-foreground text-xs font-medium z-10">
          <Zap className="h-3 w-3" />
          <span>سريع</span>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Patient Photo */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary">
            {appointment.patient_photo ? (
              <img 
                src={appointment.patient_photo} 
                alt={appointment.patient_name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              <User className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-foreground truncate font-arabic">
              {appointment.patient_name}
            </h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{formattedTime}</span>
              <span className={cn(
                "px-2 py-0.5 rounded-full text-xs font-medium",
                status.bgClass,
                status.textClass
              )}>
                {status.labelAr}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t" onClick={(e) => e.stopPropagation()}>
          {/* Primary Action */}
          {appointment.status === "arrived" && (
            <Button
              size="sm"
              onClick={handleStartConsultation}
              className="flex-1 gap-1.5"
            >
              <Stethoscope className="h-4 w-4" />
              <span>بدء الكشف</span>
            </Button>
          )}

          {appointment.status === "in-consultation" && (
            <Button
              size="sm"
              onClick={handleContinueConsultation}
              className="flex-1 gap-1.5"
            >
              <Stethoscope className="h-4 w-4" />
              <span>متابعة</span>
            </Button>
          )}

          {appointment.status === "booked" && (
            <Button
              size="sm"
              variant="default"
              onClick={(e) => { e.stopPropagation(); onCheckIn(appointment.id); }}
              className="flex-1 gap-1.5"
            >
              <CheckCircle className="h-4 w-4" />
              <span>تسجيل الوصول</span>
            </Button>
          )}

          {/* Secondary Actions */}
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onSendReminder(appointment.id); }}
            className="h-9 w-9 shrink-0"
            title="إرسال تذكير"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNoShow}
            className="h-9 w-9 shrink-0 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
            title="لم يحضر"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
