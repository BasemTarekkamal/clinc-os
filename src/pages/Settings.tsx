import { MobileLayout } from "@/components/layout/MobileLayout";
import { DepositSettings } from "@/components/settings/DepositSettings";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { FastTrackSettings } from "@/components/settings/FastTrackSettings";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function Settings() {
  return (
    <MobileLayout title="الإعدادات">
      <div className="space-y-4" dir="rtl">
        {/* Settings Stack */}
        <DepositSettings />
        <ReminderSettings />

        {/* Fast Track Settings */}
        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 shrink-0">
            <Zap className="h-4 w-4 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm">المسار السريع</h3>
            <p className="text-xs text-muted-foreground">رسوم وإعدادات الانتظار</p>
          </div>
          <FastTrackSettings
            trigger={
              <Button variant="outline" size="sm">تعديل</Button>
            }
          />
        </div>
      </div>
    </MobileLayout>
  );
}
