import { MobileLayout } from "@/components/layout/MobileLayout";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Messages() {
  return (
    <MobileLayout title="الرسائل">
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-sm">
              التواصل مع المرضى عبر الرسائل
            </p>
          </div>
          <Button size="sm" className="gap-2">
            <Send className="h-4 w-4" />
            <span>جديد</span>
          </Button>
        </div>

        {/* Coming Soon */}
        <div className="bg-card rounded-2xl p-8 border text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent mb-4">
              <MessageSquare className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-2">
              نظام الرسائل والإشعارات
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              سيتم إضافة نظام الرسائل والتكامل مع واتساب في التحديثات القادمة
            </p>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}
