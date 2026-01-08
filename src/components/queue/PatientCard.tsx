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
  dotClass: string;
  isPulsing?: boolean;
}> = {
  booked: { 
    label: "Booked", 
    labelAr: "محجوز", 
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground"
  },
  arrived: { 
    label: "Arrived", 
    labelAr: "وصل", 
    bgClass: "bg-emerald-500/10",
    textClass: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500"
  },
  "in-consultation": { 
    label: "In Consultation", 
    labelAr: "في الكشف", 
    bgClass: "bg-primary/10",
    textClass: "text-primary",
    dotClass: "bg-primary",
    isPulsing: true
  },
  late: { 
    label: "Late", 
    labelAr: "متأخر", 
    bgClass: "bg-red-500/10",
    textClass: "text-red-600 dark:text-red-400",
    dotClass: "bg-red-500"
  },
  "no-show": { 
    label: "No Show", 
    labelAr: "لم يحضر", 
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    dotClass: "bg-muted-foreground"
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
    }, 400);
  };

  const handleOpenProfile = async () => {
    if (isProcessing) return;
    
    if (appointment.patient_id) {
      navigate(`/patient/${appointment.patient_id}`);
      return;
    }

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
    "h:mm a", 
    { locale: ar }
  );

  return (
    <div 
      className={cn(
        "group relative rounded-2xl bg-card border border-border/50 transition-all duration-300",
        "hover:border-border hover:shadow-md",
        "active:scale-[0.99] cursor-pointer",
        appointment.status === "in-consultation" && "ring-2 ring-primary/50 pulse-border",
        isExiting && "opacity-0 -translate-x-full",
        isProcessing && "opacity-60 pointer-events-none"
      )}
      onClick={handleOpenProfile}
    >
      {/* Fast Track Badge */}
      {appointment.is_fast_track && (
        <div className="absolute -top-2 -end-2 z-10">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold shadow-lg">
            <Zap className="h-3 w-3" />
            <span>سريع</span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Patient Avatar */}
          <div className={cn(
            "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl",
            "bg-gradient-to-br from-secondary to-muted"
          )}>
            {appointment.patient_photo ? (
              <img 
                src={appointment.patient_photo} 
                alt={appointment.patient_name}
                className="h-full w-full rounded-2xl object-cover"
              />
            ) : (
              <User className="h-7 w-7 text-muted-foreground" />
            )}
            {/* Status Dot */}
            <span className={cn(
              "absolute -bottom-1 -end-1 h-4 w-4 rounded-full border-2 border-card",
              status.dotClass,
              status.isPulsing && "animate-pulse"
            )} />
          </div>

          {/* Patient Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-foreground truncate">
              {appointment.patient_name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">{formattedTime}</span>
              </div>
              <span className={cn(
                "status-pill",
                status.bgClass,
                status.textClass
              )}>
                <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
                {status.labelAr}
              </span>
            </div>
          </div>

          {/* Arrow */}
          <ChevronLeft className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>

        {/* Action Buttons */}
        <div 
          className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50" 
          onClick={(e) => e.stopPropagation()}
        >
          {/* Primary Action Based on Status */}
          {appointment.status === "arrived" && (
            <Button
              size="sm"
              onClick={handleStartConsultation}
              className="flex-1 gap-2 h-10 rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
            >
              <Stethoscope className="h-4 w-4" />
              <span className="font-semibold">بدء الكشف</span>
            </Button>
          )}

          {appointment.status === "in-consultation" && (
            <Button
              size="sm"
              onClick={handleContinueConsultation}
              className="flex-1 gap-2 h-10 rounded-xl bg-gradient-to-r from-primary to-cyan-500 hover:opacity-90"
            >
              <Stethoscope className="h-4 w-4" />
              <span className="font-semibold">متابعة الكشف</span>
            </Button>
          )}

          {appointment.status === "booked" && (
            <Button
              size="sm"
              variant="default"
              onClick={(e) => { e.stopPropagation(); onCheckIn(appointment.id); }}
              className="flex-1 gap-2 h-10 rounded-xl"
            >
              <CheckCircle className="h-4 w-4" />
              <span className="font-semibold">تسجيل الوصول</span>
            </Button>
          )}

          {/* Secondary Actions */}
          <Button
            variant="outline"
            size="icon"
            onClick={(e) => { e.stopPropagation(); onSendReminder(appointment.id); }}
            className="h-10 w-10 shrink-0 rounded-xl border-border/50 hover:bg-secondary"
            title="إرسال تذكير"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNoShow}
            className="h-10 w-10 shrink-0 rounded-xl border-border/50 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50"
            title="لم يحضر"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
