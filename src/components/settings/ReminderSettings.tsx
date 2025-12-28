import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, MessageSquare, Phone, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useClinicSettings } from "@/hooks/useClinicSettings";
import { toast } from "sonner";

export function ReminderSettings() {
  const { reminderSettings, updateReminderSettings } = useClinicSettings();
  const [enabled, setEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [minutesBefore, setMinutesBefore] = useState("60");

  useEffect(() => {
    if (reminderSettings) {
      setEnabled(reminderSettings.enabled);
      setSmsEnabled(reminderSettings.sms_enabled);
      setWhatsappEnabled(reminderSettings.whatsapp_enabled);
      setMinutesBefore(reminderSettings.minutes_before.toString());
    }
  }, [reminderSettings]);

  const handleSave = async () => {
    try {
      await updateReminderSettings.mutateAsync({
        enabled,
        sms_enabled: smsEnabled,
        whatsapp_enabled: whatsappEnabled,
        minutes_before: parseInt(minutesBefore) || 60,
      });
      toast.success("تم حفظ إعدادات التذكيرات بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">تذكيرات المواعيد</CardTitle>
            <CardDescription>
              إرسال تذكيرات تلقائية للمرضى قبل مواعيدهم
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="reminder-enabled">تفعيل التذكيرات</Label>
            <p className="text-sm text-muted-foreground">
              إرسال تذكيرات تلقائية للمرضى قبل الموعد
            </p>
          </div>
          <Switch
            id="reminder-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <>
            <div className="space-y-4">
              <Label>طريقة الإرسال</Label>
              
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-enabled" className="font-normal">رسائل SMS</Label>
                    <p className="text-xs text-muted-foreground">إرسال تذكير عبر رسالة نصية</p>
                  </div>
                </div>
                <Switch
                  id="sms-enabled"
                  checked={smsEnabled}
                  onCheckedChange={setSmsEnabled}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp-enabled" className="font-normal">واتساب</Label>
                    <p className="text-xs text-muted-foreground">إرسال تذكير عبر واتساب (قريباً)</p>
                  </div>
                </div>
                <Switch
                  id="whatsapp-enabled"
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                  disabled
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="minutes-before">وقت التذكير</Label>
              <Select value={minutesBefore} onValueChange={setMinutesBefore}>
                <SelectTrigger className="max-w-[200px]">
                  <SelectValue placeholder="اختر الوقت" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">قبل 30 دقيقة</SelectItem>
                  <SelectItem value="60">قبل ساعة</SelectItem>
                  <SelectItem value="120">قبل ساعتين</SelectItem>
                  <SelectItem value="180">قبل 3 ساعات</SelectItem>
                  <SelectItem value="1440">قبل يوم</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            يتم إرسال التذكيرات تلقائياً للمرضى الذين لديهم رقم هاتف مسجل.
            تأكد من إعداد بيانات Twilio لتفعيل خدمة SMS.
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateReminderSettings.isPending}>
          {updateReminderSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </CardContent>
    </Card>
  );
}
