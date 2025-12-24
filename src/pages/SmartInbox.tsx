import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ConversationList, Conversation, mockConversations } from "@/components/inbox/ConversationList";
import { ChatWindow } from "@/components/inbox/ChatWindow";

export default function SmartInbox() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(
    mockConversations[1] // Pre-select the AI-handled conversation
  );

  return (
    <AppLayout>
      <div className="h-[calc(100vh-64px)] flex" dir="rtl">
        {/* Conversation List - Sidebar */}
        <div className="w-80 border-l bg-card shrink-0 flex flex-col">
          <ConversationList 
            selectedId={selectedConversation?.id || null}
            onSelect={setSelectedConversation}
          />
        </div>

        {/* Chat Window */}
        <ChatWindow conversation={selectedConversation} />
      </div>
    </AppLayout>
  );
}
