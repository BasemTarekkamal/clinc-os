import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LedgerEntry {
  id: string;
  patientName: string;
  serviceType: "consultation" | "checkup" | "follow-up";
  price: number;
  paymentMethod: "cash" | "instapay" | "card";
  time: string;
  status: "paid" | "pending";
}

const mockData: LedgerEntry[] = [
  { id: "1", patientName: "أحمد محمد علي", serviceType: "consultation", price: 350, paymentMethod: "cash", time: "09:15", status: "paid" },
  { id: "2", patientName: "فاطمة حسن", serviceType: "checkup", price: 500, paymentMethod: "instapay", time: "09:45", status: "paid" },
  { id: "3", patientName: "محمود السيد", serviceType: "follow-up", price: 200, paymentMethod: "card", time: "10:30", status: "paid" },
  { id: "4", patientName: "سارة أحمد", serviceType: "consultation", price: 350, paymentMethod: "cash", time: "11:00", status: "paid" },
  { id: "5", patientName: "عمر خالد", serviceType: "consultation", price: 550, paymentMethod: "instapay", time: "11:45", status: "pending" },
  { id: "6", patientName: "نورا محمد", serviceType: "checkup", price: 500, paymentMethod: "card", time: "12:15", status: "paid" },
  { id: "7", patientName: "كريم عبدالله", serviceType: "follow-up", price: 200, paymentMethod: "cash", time: "14:00", status: "paid" },
  { id: "8", patientName: "هدى إبراهيم", serviceType: "consultation", price: 350, paymentMethod: "instapay", time: "14:30", status: "pending" },
];

const serviceLabels: Record<LedgerEntry["serviceType"], string> = {
  consultation: "استشارة",
  checkup: "كشف",
  "follow-up": "متابعة",
};

const paymentLabels: Record<LedgerEntry["paymentMethod"], string> = {
  cash: "نقدي",
  instapay: "InstaPay",
  card: "بطاقة",
};

const paymentColors: Record<LedgerEntry["paymentMethod"], string> = {
  cash: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]",
  instapay: "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]",
  card: "bg-[hsl(var(--warning))] text-[hsl(var(--warning-foreground))]",
};

export function DailyLedger() {
  return (
    <div className="bg-card rounded-2xl border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-foreground">سجل اليوم</h3>
        <p className="text-sm text-muted-foreground">المواعيد المكتملة اليوم</p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">الوقت</TableHead>
            <TableHead className="text-right">المريض</TableHead>
            <TableHead className="text-right">نوع الخدمة</TableHead>
            <TableHead className="text-right">السعر</TableHead>
            <TableHead className="text-right">طريقة الدفع</TableHead>
            <TableHead className="text-right">الحالة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-mono text-muted-foreground">
                {entry.time}
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {entry.patientName}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {serviceLabels[entry.serviceType]}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold text-foreground">
                {entry.price} ج.م
              </TableCell>
              <TableCell>
                <Badge className={cn("font-medium", paymentColors[entry.paymentMethod])}>
                  {paymentLabels[entry.paymentMethod]}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={entry.status === "paid" ? "default" : "outline"}
                  className={cn(
                    entry.status === "paid" 
                      ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))]" 
                      : "border-[hsl(var(--warning))] text-[hsl(var(--warning))]"
                  )}
                >
                  {entry.status === "paid" ? "مدفوع" : "معلق"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
