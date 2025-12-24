import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
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

    const { error } = await supabase.from("patients").insert({
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
    });

    if (error) {
      console.error("Error adding patient:", error);
      toast({
        title: "خطأ",
        description: "فشل في إضافة المريض",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم بنجاح",
        description: "تمت إضافة المريض",
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
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              سجل المرضى (EMR)
            </h1>
            <p className="text-muted-foreground">
              إدارة ملفات المرضى والسجلات الطبية
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span>إضافة مريض</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]" dir="rtl">
              <DialogHeader>
                <DialogTitle>إضافة مريض جديد</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>الاسم بالإنجليزية *</Label>
                    <Input
                      value={newPatient.name}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, name: e.target.value })
                      }
                      placeholder="Ahmed Mahmoud"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الاسم بالعربية</Label>
                    <Input
                      value={newPatient.name_ar}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, name_ar: e.target.value })
                      }
                      placeholder="أحمد محمود"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>العمر *</Label>
                    <Input
                      type="number"
                      value={newPatient.age}
                      onChange={(e) =>
                        setNewPatient({ ...newPatient, age: e.target.value })
                      }
                      placeholder="35"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الجنس</Label>
                    <Select
                      value={newPatient.gender}
                      onValueChange={(value) =>
                        setNewPatient({ ...newPatient, gender: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">ذكر</SelectItem>
                        <SelectItem value="female">أنثى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>فصيلة الدم</Label>
                    <Select
                      value={newPatient.blood_type}
                      onValueChange={(value) =>
                        setNewPatient({ ...newPatient, blood_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر" />
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
                  <Label>رقم الهاتف</Label>
                  <Input
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, phone: e.target.value })
                    }
                    placeholder="+201001234567"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الأمراض المزمنة (مفصولة بفاصلة)</Label>
                  <Input
                    value={newPatient.chronic_conditions}
                    onChange={(e) =>
                      setNewPatient({
                        ...newPatient,
                        chronic_conditions: e.target.value,
                      })
                    }
                    placeholder="سكري, ضغط دم"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الحساسيات (مفصولة بفاصلة)</Label>
                  <Input
                    value={newPatient.allergies}
                    onChange={(e) =>
                      setNewPatient({ ...newPatient, allergies: e.target.value })
                    }
                    placeholder="بنسلين, أسبرين"
                  />
                </div>
                <Button onClick={handleAddPatient} className="w-full mt-2">
                  إضافة المريض
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن مريض..."
              className="ps-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" onClick={fetchPatients}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Patients List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-card rounded-2xl p-12 border text-center">
            <div className="flex flex-col items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "لا توجد نتائج" : "لا يوجد مرضى"}
              </h3>
              <p className="text-muted-foreground max-w-md">
                {searchQuery
                  ? "جرب البحث بكلمات مختلفة"
                  : "اضغط على زر إضافة مريض للبدء"}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="bg-card rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/patient/${patient.id}`)}
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {patient.name_ar?.[0] || patient.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">
                      {patient.name_ar || patient.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {patient.gender === "male" ? "ذكر" : "أنثى"} • {patient.age}{" "}
                      سنة
                    </p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {patient.blood_type && (
                        <Badge variant="outline" className="gap-1">
                          <Droplet className="h-3 w-3" />
                          {patient.blood_type}
                        </Badge>
                      )}
                      {patient.phone && (
                        <Badge variant="secondary" className="gap-1">
                          <Phone className="h-3 w-3" />
                          {patient.phone}
                        </Badge>
                      )}
                    </div>
                    {patient.chronic_conditions &&
                      patient.chronic_conditions.length > 0 && (
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {patient.chronic_conditions.slice(0, 2).map((c, i) => (
                            <Badge key={i} variant="destructive" className="text-xs">
                              {c}
                            </Badge>
                          ))}
                          {patient.chronic_conditions.length > 2 && (
                            <Badge variant="outline" className="text-xs">
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
    </AppLayout>
  );
}
