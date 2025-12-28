import { User, Phone, Droplet, AlertTriangle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface Patient {
  id: string;
  name: string;
  name_ar?: string;
  age: number;
  gender: string;
  blood_type?: string;
  phone?: string;
  chronic_conditions: string[];
  allergies: string[];
  photo_url?: string;
}

interface PatientInfoProps {
  patient: Patient;
}

export function PatientInfo({ patient }: PatientInfoProps) {
  return (
    <div className="bg-card rounded-2xl border p-6 space-y-6">
      {/* Header with Photo and Name */}
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-secondary">
          {patient.photo_url ? (
            <img 
              src={patient.photo_url} 
              alt={patient.name}
              className="h-full w-full rounded-2xl object-cover"
            />
          ) : (
            <User className="h-10 w-10 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground font-arabic">
            {patient.name_ar || patient.name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {patient.gender === "male" ? "ذكر" : "أنثى"} • {patient.age > 0 ? `${patient.age} سنة` : "العمر غير معروف"}
          </p>
        </div>
      </div>

      {/* Contact & Blood Type */}
      <div className="grid grid-cols-2 gap-4">
        {/* Phone */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
          <Phone className="h-5 w-5 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">الهاتف</p>
            <p className="text-sm font-medium text-foreground" dir="ltr">
              {patient.phone || "غير محدد"}
            </p>
          </div>
        </div>

        {/* Blood Type */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary">
          <Droplet className="h-5 w-5 text-destructive" />
          <div>
            <p className="text-xs text-muted-foreground">فصيلة الدم</p>
            <p className="text-sm font-bold text-foreground">
              {patient.blood_type || "غير محدد"}
            </p>
          </div>
        </div>
      </div>

      {/* Chronic Conditions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-warning" />
          <h3 className="text-sm font-semibold text-foreground">الأمراض المزمنة</h3>
        </div>
        {patient.chronic_conditions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {patient.chronic_conditions.map((condition, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-warning/10 text-warning border-warning/20"
              >
                {condition}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد أمراض مزمنة مسجلة</p>
        )}
      </div>

      {/* Allergies */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <h3 className="text-sm font-semibold text-foreground">الحساسية</h3>
        </div>
        {patient.allergies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {patient.allergies.map((allergy, index) => (
              <Badge 
                key={index} 
                variant="destructive"
                className="bg-destructive/10 text-destructive border-destructive/20"
              >
                {allergy}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">لا توجد حساسية مسجلة</p>
        )}
      </div>
    </div>
  );
}
