import { useState } from "react";
import { 
  X, 
  Mic, 
  Save, 
  Stethoscope,
  Activity,
  Thermometer,
  Scale,
  HeartPulse
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PrescriptionBuilder, type PrescriptionItem } from "./PrescriptionBuilder";
import { FileDropzone } from "./FileDropzone";
import { cn } from "@/lib/utils";
import type { Patient } from "./PatientInfo";

interface ConsultationOverlayProps {
  patient: Patient;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: ConsultationData) => void;
}

export interface ConsultationData {
  chiefComplaint: string;
  diagnosis: string;
  notes: string;
  vitals: {
    bpSystolic: string;
    bpDiastolic: string;
    weight: string;
    temperature: string;
    heartRate: string;
  };
  prescriptions: PrescriptionItem[];
  files: any[];
}

export function ConsultationOverlay({ patient, isOpen, onClose, onSave }: ConsultationOverlayProps) {
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [vitals, setVitals] = useState({
    bpSystolic: "",
    bpDiastolic: "",
    weight: "",
    temperature: "",
    heartRate: "",
  });
  const [prescriptions, setPrescriptions] = useState<PrescriptionItem[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onSave({
      chiefComplaint,
      diagnosis,
      notes,
      vitals,
      prescriptions,
      files,
    });
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden slide-in"
        dir="rtl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-3">
            <Stethoscope className="h-6 w-6" />
            <div>
              <h2 className="text-lg font-bold">بدء الاستشارة</h2>
              <p className="text-sm opacity-90">{patient.name_ar || patient.name}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-primary-foreground hover:bg-primary-foreground/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6 space-y-6">
          {/* Chief Complaint */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              الشكوى الرئيسية
            </label>
            <Textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              placeholder="وصف الشكوى الرئيسية للمريض..."
              className="min-h-[100px] bg-card"
            />
          </div>

          {/* Vitals */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">العلامات الحيوية</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {/* Blood Pressure */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <HeartPulse className="h-3 w-3" />
                  ضغط الدم
                </label>
                <div className="flex items-center gap-1">
                  <Input
                    value={vitals.bpSystolic}
                    onChange={(e) => setVitals({...vitals, bpSystolic: e.target.value})}
                    placeholder="120"
                    className="bg-card text-center"
                  />
                  <span className="text-muted-foreground">/</span>
                  <Input
                    value={vitals.bpDiastolic}
                    onChange={(e) => setVitals({...vitals, bpDiastolic: e.target.value})}
                    placeholder="80"
                    className="bg-card text-center"
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Scale className="h-3 w-3" />
                  الوزن (كجم)
                </label>
                <Input
                  value={vitals.weight}
                  onChange={(e) => setVitals({...vitals, weight: e.target.value})}
                  placeholder="75"
                  className="bg-card"
                />
              </div>

              {/* Temperature */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <Thermometer className="h-3 w-3" />
                  الحرارة (°C)
                </label>
                <Input
                  value={vitals.temperature}
                  onChange={(e) => setVitals({...vitals, temperature: e.target.value})}
                  placeholder="37"
                  className="bg-card"
                />
              </div>

              {/* Heart Rate */}
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground flex items-center gap-1">
                  <HeartPulse className="h-3 w-3" />
                  النبض
                </label>
                <Input
                  value={vitals.heartRate}
                  onChange={(e) => setVitals({...vitals, heartRate: e.target.value})}
                  placeholder="72"
                  className="bg-card"
                />
              </div>
            </div>
          </div>

          {/* Quick Notes with Voice Icon */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>ملاحظات سريعة</span>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 text-muted-foreground hover:text-primary"
              >
                <Mic className="h-4 w-4" />
                <span className="text-xs">تسجيل صوتي</span>
              </Button>
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات إضافية..."
              className="min-h-[80px] bg-card"
            />
          </div>

          {/* Prescription Builder */}
          <div className="p-4 rounded-xl bg-secondary/30">
            <PrescriptionBuilder
              prescriptions={prescriptions}
              onChange={setPrescriptions}
            />
          </div>

          {/* File Upload */}
          <FileDropzone
            patientId={patient.id}
            files={files}
            onFilesChange={setFiles}
          />

          {/* Diagnosis */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-primary" />
              التشخيص النهائي
            </label>
            <Textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="التشخيص..."
              className="min-h-[80px] bg-card"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 bg-card border-t">
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "جاري الحفظ..." : "حفظ الزيارة"}
          </Button>
        </div>
      </div>
    </div>
  );
}
