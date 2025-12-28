import { AppLayout } from "@/components/layout/AppLayout";
import { Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RevenueSummary } from "@/components/finances/RevenueSummary";
import { DailyLedger, getLedgerData } from "@/components/finances/DailyLedger";
import { FastTrackSettings } from "@/components/settings/FastTrackSettings";
import { exportFinancesToExcel } from "@/lib/exportToExcel";
import { useToast } from "@/hooks/use-toast";

export default function Finances() {
  const { toast } = useToast();

  const handleExport = () => {
    const data = getLedgerData();
    exportFinancesToExcel(data);
    toast({
      title: "تم التصدير",
      description: "تم تصدير التقرير المالي بنجاح"
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              المالية
            </h1>
            <p className="text-muted-foreground">
              إدارة الفواتير والمدفوعات
            </p>
          </div>
          <div className="flex gap-2">
            <FastTrackSettings 
              trigger={
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  <span>إعدادات المسار السريع</span>
                </Button>
              }
            />
            <Button variant="outline" className="gap-2" onClick={handleExport}>
              <Download className="h-4 w-4" />
              <span>تصدير التقرير</span>
            </Button>
          </div>
        </div>

        {/* Revenue Summary Cards */}
        <RevenueSummary />

        {/* Daily Ledger */}
        <DailyLedger />
      </div>
    </AppLayout>
  );
}
