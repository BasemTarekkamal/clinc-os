import { AppLayout } from "@/components/layout/AppLayout";
import { DepositSettings } from "@/components/settings/DepositSettings";
import { ReminderSettings } from "@/components/settings/ReminderSettings";
import { FastTrackSettings } from "@/components/settings/FastTrackSettings";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon, Zap } from "lucide-react";

export default function Settings() {
  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <SettingsIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">الإعدادات</h1>
            <p className="text-muted-foreground">إدارة إعدادات العيادة</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          <DepositSettings />
          <ReminderSettings />
        </div>

        {/* Fast Track Settings */}
        <div className="flex items-center gap-4 rounded-lg border p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
            <Zap className="h-5 w-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium">إعدادات المسار السريع</h3>
            <p className="text-sm text-muted-foreground">
              تخصيص رسوم المسار السريع وإعدادات وقت الانتظار
            </p>
          </div>
          <FastTrackSettings
            trigger={
              <Button variant="outline">
                تعديل الإعدادات
              </Button>
            }
          />
        </div>
      </div>
    </AppLayout>
  );
}
