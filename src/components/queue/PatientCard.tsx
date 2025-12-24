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
  FileText
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
    labelAr: "متأخر / خطر", 
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
  onStartConsultation
}: PatientCardProps) {
  const [isExiting, setIsExiting] = useState(false);
  const navigate = useNavigate();
  const status = statusConfig[appointment.status];

  const handleNoShow = () => {
    setIsExiting(true);
    setTimeout(() => {
      onNoShow(appointment.id);
    }, 500);
  };

  const handleOpenProfile = () => {
    if (appointment.patient_id) {
      navigate(`/patient/${appointment.patient_id}`);
    }
  };

  const handleStartConsultation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onStartConsultation) {
      onStartConsultation(appointment.id);
    }
    if (appointment.patient_id) {
      navigate(`/patient/${appointment.patient_id}?consultation=true`);
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
        "relative flex items-center gap-4 p-4 rounded-xl bg-card border transition-all duration-300",
        "hover:shadow-md slide-in cursor-pointer",
        status.borderClass,
        isExiting && "fade-out"
      )}
      onClick={handleOpenProfile}
    >
      {/* Fast Track Badge */}
      {appointment.is_fast_track && (
        <div className="absolute -top-2 -end-2 flex items-center gap-1 px-2 py-1 rounded-full bg-warning text-warning-foreground text-xs font-medium">
          <Zap className="h-3 w-3" />
          <span>سريع</span>
        </div>
      )}

      {/* Patient Photo */}
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary">
        {appointment.patient_photo ? (
          <img 
            src={appointment.patient_photo} 
            alt={appointment.patient_name}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          <User className="h-7 w-7 text-muted-foreground" />
        )}
      </div>

      {/* Patient Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold text-foreground truncate font-arabic">
          {appointment.patient_name}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{formattedTime}</span>
        </div>
      </div>

      {/* Status Badge */}
      <div className={cn(
        "px-3 py-1.5 rounded-full text-sm font-medium",
        status.bgClass,
        status.textClass
      )}>
        {status.labelAr}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        {/* View Profile */}
        <Button
          variant="outline"
          size="lg"
          onClick={handleOpenProfile}
          className={cn(
            "h-12 w-12 p-0 rounded-xl transition-all duration-200",
            "hover:bg-accent hover:text-accent-foreground"
          )}
          title="عرض الملف"
        >
          <FileText className="h-5 w-5" />
        </Button>

        {/* Start Consultation - Only for arrived patients */}
        {appointment.status === "arrived" && (
          <Button
            variant="outline"
            size="lg"
            onClick={handleStartConsultation}
            className={cn(
              "h-12 w-12 p-0 rounded-xl transition-all duration-200",
              "hover:bg-primary hover:text-primary-foreground hover:border-primary"
            )}
            title="بدء الاستشارة"
          >
            <Stethoscope className="h-5 w-5" />
          </Button>
        )}

        {/* Check In */}
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => { e.stopPropagation(); onCheckIn(appointment.id); }}
          disabled={appointment.status === "arrived" || appointment.status === "in-consultation"}
          className={cn(
            "h-12 w-12 p-0 rounded-xl transition-all duration-200",
            "hover:bg-success hover:text-success-foreground hover:border-success",
            "disabled:opacity-50"
          )}
          title="تسجيل الحضور"
        >
          <CheckCircle className="h-5 w-5" />
        </Button>

        {/* Send Reminder */}
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => { e.stopPropagation(); onSendReminder(appointment.id); }}
          className={cn(
            "h-12 w-12 p-0 rounded-xl transition-all duration-200",
            "hover:bg-primary hover:text-primary-foreground hover:border-primary"
          )}
          title="إرسال تذكير"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>

        {/* No Show */}
        <Button
          variant="outline"
          size="lg"
          onClick={(e) => { e.stopPropagation(); handleNoShow(); }}
          className={cn(
            "h-12 w-12 p-0 rounded-xl transition-all duration-200",
            "hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
          )}
          title="لم يحضر"
        >
          <XCircle className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
