import { AppLayout } from "@/components/layout/AppLayout";
import { MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Messages() {
  return (
    <AppLayout>
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              الرسائل
            </h1>
            <p className="text-muted-foreground">
              التواصل مع المرضى عبر الرسائل
            </p>
          </div>
          <Button className="gap-2">
            <Send className="h-4 w-4" />
            <span>رسالة جديدة</span>
          </Button>
        </div>

        {/* Coming Soon */}
        <div className="bg-card rounded-2xl p-12 border text-center">
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              نظام الرسائل والإشعارات
            </h3>
            <p className="text-muted-foreground max-w-md">
              سيتم إضافة نظام الرسائل والتكامل مع واتساب في التحديثات القادمة
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
