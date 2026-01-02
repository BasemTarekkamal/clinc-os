// Smart Inbox - AI-powered chat management (Mobile-first design)
import { useState } from "react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { ConversationList, Conversation } from "@/components/inbox/ConversationList";
import { ChatWindow } from "@/components/inbox/ChatWindow";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmartInbox() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Mobile: Show chat view when conversation is selected
  if (selectedConversation) {
    return (
      <div className="flex flex-col min-h-screen bg-background" dir="rtl">
        {/* Custom header for chat */}
        <header className="sticky top-0 z-50 bg-card border-b border-border px-4 py-3 safe-area-top">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedConversation(null)}
              className="h-10 w-10"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-medium text-secondary-foreground">
                  {selectedConversation.patient_name.charAt(0)}
                </span>
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground">
                  {selectedConversation.patient_name}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {selectedConversation.is_ai_handled ? "AI يرد تلقائياً" : "أنت ترد"}
                </p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Chat window - full height */}
        <div className="flex-1 flex flex-col">
          <ChatWindow conversation={selectedConversation} />
        </div>
      </div>
    );
  }

  // Mobile: Show conversation list
  return (
    <MobileLayout title="صندوق الوارد" hideBottomNav={false}>
      <div className="-mx-4 -mt-4 h-[calc(100vh-140px)]" dir="rtl">
        <ConversationList 
          selectedId={null}
          onSelect={setSelectedConversation}
        />
      </div>
    </MobileLayout>
  );
}
