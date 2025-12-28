import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Wallet, Info } from "lucide-react";
import { useState, useEffect } from "react";
import { useClinicSettings } from "@/hooks/useClinicSettings";
import { toast } from "sonner";

export function DepositSettings() {
  const { depositSettings, updateDepositSettings } = useClinicSettings();
  const [enabled, setEnabled] = useState(false);
  const [amount, setAmount] = useState("100");

  useEffect(() => {
    if (depositSettings) {
      setEnabled(depositSettings.enabled);
      setAmount(depositSettings.amount.toString());
    }
  }, [depositSettings]);

  const handleSave = async () => {
    try {
      await updateDepositSettings.mutateAsync({
        enabled,
        amount: parseInt(amount) || 100,
      });
      toast.success("تم حفظ إعدادات العربون بنجاح");
    } catch (error) {
      toast.error("حدث خطأ أثناء حفظ الإعدادات");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">عربون الجدية</CardTitle>
            <CardDescription>
              تقليل حالات عدم الحضور عن طريق طلب عربون مع الحجز
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="deposit-enabled">تفعيل عربون الجدية</Label>
            <p className="text-sm text-muted-foreground">
              سيتم إبلاغ المرضى بمتطلبات العربون عند الحجز
            </p>
          </div>
          <Switch
            id="deposit-enabled"
            checked={enabled}
            onCheckedChange={setEnabled}
          />
        </div>

        {enabled && (
          <div className="space-y-3">
            <Label htmlFor="deposit-amount">مبلغ العربون (جنيه)</Label>
            <Input
              id="deposit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              className="max-w-[200px]"
            />
          </div>
        )}

        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">
            عند تفعيل هذا الخيار، سيقوم المساعد الذكي بإبلاغ المرضى بأن هناك عربون
            جدية بقيمة {amount} جنيه يُدفع عند الحجز ويُخصم من قيمة الكشف.
          </p>
        </div>

        <Button onClick={handleSave} disabled={updateDepositSettings.isPending}>
          {updateDepositSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </CardContent>
    </Card>
  );
}
