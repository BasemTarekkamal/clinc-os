import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Settings, Zap } from "lucide-react";

interface FastTrackSettingsProps {
  trigger?: React.ReactNode;
}

export function FastTrackSettings({ trigger }: FastTrackSettingsProps) {
  const [enabled, setEnabled] = useState(true);
  const [fee, setFee] = useState("200");
  const [waitTimeBuffer, setWaitTimeBuffer] = useState([15]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            <span>الإعدادات</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[hsl(var(--warning))]" />
            إعدادات المسار السريع
          </DialogTitle>
          <DialogDescription>
            تخصيص خيارات المسار السريع للمواعيد العاجلة
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Enable Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="fast-track-toggle" className="text-base font-medium">
                تفعيل المسار السريع
              </Label>
              <p className="text-sm text-muted-foreground">
                السماح بحجز مواعيد سريعة بدون انتظار
              </p>
            </div>
            <Switch
              id="fast-track-toggle"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Fee Input */}
          <div className="space-y-2">
            <Label htmlFor="fast-track-fee" className="text-base font-medium">
              رسوم المسار السريع
            </Label>
            <div className="relative">
              <Input
                id="fast-track-fee"
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className="pl-16"
                disabled={!enabled}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                ج.م
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              رسوم إضافية تُضاف إلى سعر الكشف الأساسي
            </p>
          </div>

          {/* Wait Time Buffer Slider */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                تعديل وقت الانتظار المعروض
              </Label>
              <span className="text-sm font-medium text-primary">
                +{waitTimeBuffer[0]} دقيقة
              </span>
            </div>
            <Slider
              value={waitTimeBuffer}
              onValueChange={setWaitTimeBuffer}
              max={30}
              min={0}
              step={5}
              disabled={!enabled}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              إضافة وقت إضافي للتقدير المعروض للمرضى لضمان عدم التأخير
            </p>
          </div>

          {/* Preview */}
          <div className="bg-accent rounded-xl p-4">
            <p className="text-sm font-medium text-accent-foreground mb-2">
              معاينة للمريض:
            </p>
            <p className="text-sm text-muted-foreground">
              "وقت الانتظار المتوقع: <span className="font-semibold text-foreground">{10 + waitTimeBuffer[0]} دقيقة</span>"
            </p>
            {enabled && (
              <p className="text-sm text-[hsl(var(--warning))] mt-1">
                "أو احجز مسار سريع بـ <span className="font-semibold">{fee} ج.م</span> إضافية"
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button className="flex-1" disabled={!enabled}>
            حفظ الإعدادات
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
