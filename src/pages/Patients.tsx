import { AppLayout } from "@/components/layout/AppLayout";
import { Users, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Patients() {
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
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            <span>إضافة مريض</span>
          </Button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="البحث عن مريض..."
            className="ps-10"
          />
        </div>

        {/* Coming Soon */}
        <div className="bg-card rounded-2xl p-12 border text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              نظام السجلات الطبية الإلكترونية
            </h3>
            <p className="text-muted-foreground max-w-md">
              سيتم إضافة نظام إدارة ملفات المرضى الكامل في التحديثات القادمة
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
