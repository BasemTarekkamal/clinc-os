import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// WhatsApp and Messenger icons as inline SVGs for better styling
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function MessengerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.302 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
    </svg>
  );
}

export interface Conversation {
  id: string;
  name: string;
  lastMessage: string;
  time: string;
  unread: number;
  source: "whatsapp" | "messenger";
  avatar?: string;
  isAiHandled: boolean;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    name: "محمد أحمد",
    lastMessage: "شكراً، سأكون في الموعد",
    time: "منذ 5 د",
    unread: 0,
    source: "whatsapp",
    isAiHandled: false,
  },
  {
    id: "2",
    name: "سارة علي",
    lastMessage: "ما هو سعر الكشف؟",
    time: "منذ 12 د",
    unread: 1,
    source: "whatsapp",
    isAiHandled: true,
  },
  {
    id: "3",
    name: "أحمد خالد",
    lastMessage: "هل يوجد موعد اليوم؟",
    time: "منذ 25 د",
    unread: 0,
    source: "messenger",
    isAiHandled: true,
  },
  {
    id: "4",
    name: "نورا حسن",
    lastMessage: "تمام، شكراً للتأكيد",
    time: "منذ ساعة",
    unread: 0,
    source: "whatsapp",
    isAiHandled: false,
  },
  {
    id: "5",
    name: "عمر محمود",
    lastMessage: "عايز أحجز موعد للكشف",
    time: "منذ ساعتين",
    unread: 2,
    source: "messenger",
    isAiHandled: true,
  },
];

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-foreground">المحادثات</h3>
        <p className="text-sm text-muted-foreground">
          {mockConversations.filter(c => c.unread > 0).length} رسائل غير مقروءة
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {mockConversations.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onSelect(conversation)}
            className={cn(
              "w-full p-4 flex items-start gap-3 border-b transition-colors text-right",
              "hover:bg-accent/50",
              selectedId === conversation.id && "bg-accent"
            )}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                <span className="text-lg font-medium text-secondary-foreground">
                  {conversation.name.charAt(0)}
                </span>
              </div>
              {/* Source Icon */}
              <div className={cn(
                "absolute -bottom-1 -left-1 h-5 w-5 rounded-full flex items-center justify-center",
                conversation.source === "whatsapp" 
                  ? "bg-[#25D366]" 
                  : "bg-[#0084FF]"
              )}>
                {conversation.source === "whatsapp" ? (
                  <WhatsAppIcon className="h-3 w-3 text-white" />
                ) : (
                  <MessengerIcon className="h-3 w-3 text-white" />
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-foreground truncate">
                  {conversation.name}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {conversation.time}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm text-muted-foreground truncate flex-1">
                  {conversation.lastMessage}
                </p>
                {conversation.unread > 0 && (
                  <Badge className="h-5 min-w-[20px] rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                    {conversation.unread}
                  </Badge>
                )}
              </div>
              {conversation.isAiHandled && (
                <div className="flex items-center gap-1 mt-1">
                  <MessageCircle className="h-3 w-3 text-[hsl(var(--success))]" />
                  <span className="text-xs text-[hsl(var(--success))]">AI يرد</span>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { mockConversations };
