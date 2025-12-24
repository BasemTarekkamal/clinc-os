import { useState } from "react";
import { Plus, Trash2, Pill } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Common Egyptian drugs
const EGYPTIAN_DRUGS = [
  { name: "Panadol 500mg", nameAr: "بانادول ٥٠٠ مجم" },
  { name: "Augmentin 1g", nameAr: "أوجمنتين ١ جم" },
  { name: "Cataflam 50mg", nameAr: "كتافلام ٥٠ مجم" },
  { name: "Concor 5mg", nameAr: "كونكور ٥ مجم" },
  { name: "Glucophage 500mg", nameAr: "جلوكوفاج ٥٠٠ مجم" },
  { name: "Ventolin Inhaler", nameAr: "فنتولين بخاخ" },
  { name: "Nexium 40mg", nameAr: "نيكسيوم ٤٠ مجم" },
  { name: "Lipitor 20mg", nameAr: "ليبيتور ٢٠ مجم" },
  { name: "Aspocid 75mg", nameAr: "أسبوسيد ٧٥ مجم" },
  { name: "Zithromax 500mg", nameAr: "زيثروماكس ٥٠٠ مجم" },
  { name: "Cipro 500mg", nameAr: "سيبرو ٥٠٠ مجم" },
  { name: "Motilium 10mg", nameAr: "موتيليوم ١٠ مجم" },
  { name: "Antinal", nameAr: "أنتينال" },
  { name: "Brufen 400mg", nameAr: "بروفين ٤٠٠ مجم" },
  { name: "Congestal", nameAr: "كونجستال" },
];

const FREQUENCIES = [
  { value: "once-daily", label: "مرة يومياً" },
  { value: "twice-daily", label: "مرتين يومياً" },
  { value: "three-times", label: "٣ مرات يومياً" },
  { value: "every-8-hours", label: "كل ٨ ساعات" },
  { value: "every-12-hours", label: "كل ١٢ ساعة" },
  { value: "as-needed", label: "عند اللزوم" },
  { value: "before-meals", label: "قبل الأكل" },
  { value: "after-meals", label: "بعد الأكل" },
];

const DURATIONS = [
  { value: "3-days", label: "٣ أيام" },
  { value: "5-days", label: "٥ أيام" },
  { value: "7-days", label: "أسبوع" },
  { value: "10-days", label: "١٠ أيام" },
  { value: "14-days", label: "أسبوعين" },
  { value: "30-days", label: "شهر" },
  { value: "ongoing", label: "مستمر" },
];

export interface PrescriptionItem {
  id: string;
  drugName: string;
  drugNameAr: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface PrescriptionBuilderProps {
  prescriptions: PrescriptionItem[];
  onChange: (prescriptions: PrescriptionItem[]) => void;
}

export function PrescriptionBuilder({ prescriptions, onChange }: PrescriptionBuilderProps) {
  const [selectedDrug, setSelectedDrug] = useState("");

  const handleAddDrug = (drugValue: string) => {
    const drug = EGYPTIAN_DRUGS.find(d => d.name === drugValue);
    if (drug) {
      const newPrescription: PrescriptionItem = {
        id: crypto.randomUUID(),
        drugName: drug.name,
        drugNameAr: drug.nameAr,
        dosage: "1 قرص",
        frequency: "twice-daily",
        duration: "7-days",
      };
      onChange([...prescriptions, newPrescription]);
      setSelectedDrug("");
    }
  };

  const handleRemove = (id: string) => {
    onChange(prescriptions.filter(p => p.id !== id));
  };

  const handleUpdate = (id: string, field: keyof PrescriptionItem, value: string) => {
    onChange(prescriptions.map(p => 
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Pill className="h-5 w-5 text-success" />
        <h3 className="font-semibold text-foreground">الوصفة الطبية</h3>
      </div>

      {/* Quick Add Dropdown */}
      <Select value={selectedDrug} onValueChange={handleAddDrug}>
        <SelectTrigger className="w-full bg-card">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <SelectValue placeholder="إضافة دواء سريعة..." />
          </div>
        </SelectTrigger>
        <SelectContent className="bg-card border max-h-[300px]">
          {EGYPTIAN_DRUGS.map((drug) => (
            <SelectItem key={drug.name} value={drug.name}>
              <span className="font-arabic">{drug.nameAr}</span>
              <span className="text-muted-foreground ms-2 text-xs">({drug.name})</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Prescription Items */}
      {prescriptions.length > 0 && (
        <div className="space-y-3">
          {prescriptions.map((prescription) => (
            <div 
              key={prescription.id}
              className="p-4 rounded-xl border bg-card space-y-3 slide-in"
            >
              {/* Drug Name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="font-semibold text-foreground font-arabic">
                    {prescription.drugNameAr}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(prescription.id)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Dosage, Frequency, Duration */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">الجرعة</label>
                  <Input
                    value={prescription.dosage}
                    onChange={(e) => handleUpdate(prescription.id, "dosage", e.target.value)}
                    placeholder="1 قرص"
                    className="bg-secondary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">التكرار</label>
                  <Select 
                    value={prescription.frequency}
                    onValueChange={(v) => handleUpdate(prescription.id, "frequency", v)}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border">
                      {FREQUENCIES.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">المدة</label>
                  <Select 
                    value={prescription.duration}
                    onValueChange={(v) => handleUpdate(prescription.id, "duration", v)}
                  >
                    <SelectTrigger className="bg-secondary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border">
                      {DURATIONS.map((dur) => (
                        <SelectItem key={dur.value} value={dur.value}>
                          {dur.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {prescriptions.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          اختر أدوية من القائمة أعلاه لإضافتها للوصفة
        </p>
      )}
    </div>
  );
}
