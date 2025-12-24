import { ReactNode, useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

interface AppLayoutProps {
  children: ReactNode;
}

export type ClinicStatus = "open" | "closed" | "delayed";

export function AppLayout({ children }: AppLayoutProps) {
  const [clinicStatus, setClinicStatus] = useState<ClinicStatus>("open");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className="flex flex-1 flex-col">
        <TopBar 
          clinicName="مركز الشفاء الطبي" 
          status={clinicStatus} 
          onStatusChange={setClinicStatus}
        />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
