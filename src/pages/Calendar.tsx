import { MobileLayout } from "@/components/layout/MobileLayout";
import { AppointmentsCalendar } from "@/components/calendar/AppointmentsCalendar";

export default function Calendar() {
  return (
    <MobileLayout title="التقويم">
      <div className="h-[calc(100vh-180px)]" dir="rtl">
        <AppointmentsCalendar />
      </div>
    </MobileLayout>
  );
}
