import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Users, Search, Plus, Phone, Droplet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Patient {
  id: string;
  name: string;
  name_ar: string | null;
  age: number;
  gender: string;
  blood_type: string | null;
  phone: string | null;
  chronic_conditions: string[] | null;
  allergies: string[] | null;
  photo_url: string | null;
}

export default function Patients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    name_ar: "",
    age: "",
    gender: "male",
    blood_type: "",
    phone: "",
    chronic_conditions: "",
    allergies: "",
  });

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة المرضى",
        variant: "destructive",
      });
    } else {
      setPatients(data as Patient[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleAddPatient = async () => {
    if (!newPatient.name || !newPatient.age) {
      toast({
        title: "خطأ",
        description: "الاسم والعمر مطلوبان",
        variant: "destructive",
      });
      return;
    }

    // Insert patient and get the created record
    const { data: patientData, error } = await supabase.from("patients").insert({
      name: newPatient.name,
      name_ar: newPatient.name_ar || null,
      age: parseInt(newPatient.age),
      gender: newPatient.gender,
      blood_type: newPatient.blood_type || null,
      phone: newPatient.phone || null,
      chronic_conditions: newPatient.chronic_conditions
        ? newPatient.chronic_conditions.split(",").map((c) => c.trim())
        : [],
      allergies: newPatient.allergies
        ? newPatient.allergies.split(",").map((a) => a.trim())
        : [],
    }).select().single();

    if (error) {
      console.error("Error adding patient:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المريض",
        variant: "destructive",
      });
    } else {
      // Also create an appointment for this patient so they appear in the queue
      const { error: appointmentError } = await supabase.from("appointments").insert({
        patient_id: patientData.id,
        patient_name: newPatient.name_ar || newPatient.name,
        scheduled_time: new Date().toISOString(),
        status: "booked",
        is_fast_track: false,
      });

      if (appointmentError) {
        console.error("Error creating appointment:", appointmentError);
      }

      toast({
        title: "تم بنجاح",
        description: "تمت إضافة المريض وإضافته لقائمة الانتظار",
      });
      setIsAddDialogOpen(false);
      setNewPatient({
        name: "",
        name_ar: "",
        age: "",
        gender: "male",
        blood_type: "",
        phone: "",
        chronic_conditions: "",
        allergies: "",
      });
      fetchPatients();
    }
  };

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.name_ar?.includes(searchQuery) ||
      patient.phone?.includes(searchQuery)
  );

  return (
    <MobileLayout title="سجل المرضى">
      <div className="space-y-4" dir="rtl">
        {/* Search and Add */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث..."
              className="ps-9 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="icon" className="h-10 w-10 shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] rounded-2xl" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مريض جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-4 max-h-[70vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label className="text-xs">الاسم بالإنجليزية *</Label>
                  <Input
                    value={newPatient.name}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, name: e.target.value })
                    }
                    placeholder="Ahmed Mahmoud"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">الاسم بالعربية</Label>
                  <Input
                    value={newPatient.name_ar}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, name_ar: e.target.value })
                    }
                    placeholder="أحمد محمود"
                    className="h-10"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-2">
                    <Label className="text-xs">العمر *</Label>
                    <Input
                      type="number"
                      value={newPatient.age}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, age: e.target.value })
                      }
                      placeholder="35"
                      className="h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">الجنس</Label>
                    <Select
                      value={newPatient.gender}
                      onValueChange={(value) =>
                        setNewPatient({ ...newPatient, gender: value })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">الدم</Label>
                    <Select
                      value={newPatient.blood_type}
                      onValueChange={(value) =>
                        setNewPatient({ ...newPatient, blood_type: value })
                      }
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="-" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">رقم الهاتف</Label>
                  <Input
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                    placeholder="+201001234567"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">الأمراض المزمنة</Label>
                  <Input
                    value={newPatient.chronic_conditions}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        chronic_conditions: e.target.value,
                      })
                    }
                    placeholder="سكري, ضغط دم"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">الحساسيات</Label>
                  <Input
                    value={newPatient.allergies}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, allergies: e.target.value })
                    }
                    placeholder="بنسلين, أسبرين"
                    className="h-10"
                  />
                </div>
                <Button onClick={handleAddPatient} className="w-full h-11 mt-2">
                  إضافة المريض
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={fetchPatients}
            className="h-10 w-10 shrink-0"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-card rounded-xl p-8 border text-center">
            <div className="flex flex-col items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent mb-3">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {searchQuery ? "لا توجد نتائج" : "لا يوجد مرضى"}
              </h3>
              <p className="text-xs text-muted-foreground">
                {searchQuery ? "جرب البحث بكلمات مختلفة" : "اضغط + للإضافة"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-card rounded-xl border p-4 active:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold shrink-0">
                    {patient.name_ar?.[0] || patient.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm truncate">
                      {patient.name_ar || patient.name}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {patient.gender === "male" ? "ذكر" : "أنثى"} • {patient.age} سنة
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {patient.blood_type && (
                        <Badge variant="outline" className="gap-1 text-xs h-6">
                          <Droplet className="h-3 w-3" />
                          {patient.blood_type}
                        </Badge>
                      )}
                      {patient.phone && (
                        <Badge variant="secondary" className="gap-1 text-xs h-6">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </Badge>
                      )}
                    </div>
                    {patient.chronic_conditions && patient.chronic_conditions.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {patient.chronic_conditions.slice(0, 2).map((c, i) => (
                          <Badge key={i} variant="destructive" className="text-[10px] h-5">
                            {c}
                          </Badge>
                        ))}
                        {patient.chronic_conditions.length > 2 && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            +{patient.chronic_conditions.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MobileLayout>
  );
}
