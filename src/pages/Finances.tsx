import { MobileLayout } from "@/components/layout/MobileLayout";
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
    <MobileLayout title="المالية">
      <div className="space-y-4" dir="rtl">
        <div className="flex items-center gap-2">
          <FastTrackSettings 
            trigger={
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Settings className="h-4 w-4" />
              </Button>
            }
          />
          <Button variant="outline" size="icon" className="h-10 w-10" onClick={handleExport}>
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Revenue Summary Cards */}
        <RevenueSummary />

        {/* Daily Ledger */}
        <DailyLedger />
      </div>
    </MobileLayout>
  );
}
