import { useState } from "react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Stethoscope,
  Pill,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface Prescription {
  id: string;
  drug_name: string;
  drug_name_ar?: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

export interface Visit {
  id: string;
  visit_date: string;
  chief_complaint?: string;
  diagnosis?: string;
  notes?: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  weight?: number;
  temperature?: number;
  status: string;
  prescriptions?: Prescription[];
}

interface VisitTimelineProps {
  visits: Visit[];
}

function VisitCard({ visit }: { visit: Visit }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const formattedDate = format(
    new Date(visit.visit_date), 
    "d MMMM yyyy", 
    { locale: ar }
  );

  return (
    <div className="relative">
      {/* Timeline dot */}
      <div className="absolute -start-[25px] top-6 w-4 h-4 rounded-full bg-primary border-4 border-background" />
      
      <div 
        className={cn(
          "bg-card rounded-xl border p-4 cursor-pointer transition-all duration-200",
          "hover:shadow-md hover:border-primary/30",
          isExpanded && "border-primary/50"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">{visit.chief_complaint}</p>
            </div>
          </div>
          <button className="p-2 hover:bg-secondary rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t space-y-4 slide-in">
            {/* Vitals */}
            {(visit.bp_systolic || visit.weight || visit.temperature) && (
              <div className="grid grid-cols-3 gap-3">
                {visit.bp_systolic && visit.bp_diastolic && (
                  <div className="p-3 rounded-lg bg-secondary text-center">
                    <p className="text-xs text-muted-foreground">ضغط الدم</p>
                    <p className="font-bold text-foreground">
                      {visit.bp_systolic}/{visit.bp_diastolic}
                    </p>
                  </div>
                )}
                {visit.weight && (
                  <div className="p-3 rounded-lg bg-secondary text-center">
                    <p className="text-xs text-muted-foreground">الوزن</p>
                    <p className="font-bold text-foreground">{visit.weight} كجم</p>
                  </div>
                )}
                {visit.temperature && (
                  <div className="p-3 rounded-lg bg-secondary text-center">
                    <p className="text-xs text-muted-foreground">الحرارة</p>
                    <p className="font-bold text-foreground">{visit.temperature}°</p>
                  </div>
                )}
              </div>
            )}

            {/* Diagnosis */}
            {visit.diagnosis && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">التشخيص</h4>
                </div>
                <p className="text-sm text-foreground bg-accent/50 p-3 rounded-lg">
                  {visit.diagnosis}
                </p>
              </div>
            )}

            {/* Prescriptions */}
            {visit.prescriptions && visit.prescriptions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Pill className="h-4 w-4 text-success" />
                  <h4 className="text-sm font-semibold text-foreground">الوصفة الطبية</h4>
                </div>
                <div className="space-y-2">
                  {visit.prescriptions.map((prescription) => (
                    <div 
                      key={prescription.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {prescription.drug_name_ar || prescription.drug_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {prescription.dosage} - {prescription.frequency}
                        </p>
                      </div>
                      {prescription.duration && (
                        <Badge variant="secondary" className="text-xs">
                          {prescription.duration}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {visit.notes && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <h4 className="text-sm font-semibold text-foreground">ملاحظات</h4>
                </div>
                <p className="text-sm text-muted-foreground">{visit.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function VisitTimeline({ visits }: VisitTimelineProps) {
  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">لا توجد زيارات سابقة</p>
        <p className="text-sm text-muted-foreground">سيتم عرض سجل الزيارات هنا</p>
      </div>
    );
  }

  return (
    <div className="relative ps-6 border-s-2 border-border space-y-4">
      {visits.map((visit) => (
        <VisitCard key={visit.id} visit={visit} />
      ))}
    </div>
  );
}
