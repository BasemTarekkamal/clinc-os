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

export function getLedgerData() {
  return mockData;
}

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
  cash: "bg-success/20 text-success border-success/30",
  instapay: "bg-primary/20 text-primary border-primary/30",
  card: "bg-warning/20 text-warning border-warning/30",
};

function LedgerCard({ entry }: { entry: LedgerEntry }) {
  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-xl p-4 border border-border/50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono text-muted-foreground">{entry.time}</span>
            <Badge 
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0", paymentColors[entry.paymentMethod])}
            >
              {paymentLabels[entry.paymentMethod]}
            </Badge>
          </div>
          <p className="font-medium text-foreground truncate">{entry.patientName}</p>
          <p className="text-xs text-muted-foreground">{serviceLabels[entry.serviceType]}</p>
        </div>
        <div className="text-left shrink-0">
          <p className="font-bold text-foreground">{entry.price} ج.م</p>
          <Badge 
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0 mt-1",
              entry.status === "paid" 
                ? "bg-success/20 text-success border-success/30" 
                : "bg-warning/20 text-warning border-warning/30"
            )}
          >
            {entry.status === "paid" ? "مدفوع" : "معلق"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function DailyLedger() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">سجل اليوم</h3>
          <p className="text-xs text-muted-foreground">المواعيد المكتملة</p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {mockData.length} معاملات
        </Badge>
      </div>
      <div className="space-y-2">
        {mockData.map((entry) => (
          <LedgerCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
