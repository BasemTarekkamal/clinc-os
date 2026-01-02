import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { MobileHeader } from "./MobileHeader";

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  hideBottomNav?: boolean;
}

export function MobileLayout({ children, title, showBackButton, hideBottomNav }: MobileLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MobileHeader title={title} showBackButton={showBackButton} />
      <main className="flex-1 overflow-auto pb-20 px-4 pt-4">
        {children}
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
}
