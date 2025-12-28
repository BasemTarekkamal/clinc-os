import { AppLayout } from "@/components/layout/AppLayout";
import { AppointmentsCalendar } from "@/components/calendar/AppointmentsCalendar";

export default function Calendar() {
  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] p-6" dir="rtl">
        <AppointmentsCalendar />
      </div>
    </AppLayout>
  );
}
