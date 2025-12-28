import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MessageCircle, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

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

function WebsiteIcon({ className }: { className?: string }) {
  return <Globe className={className} />;
}

export interface Conversation {
  id: string;
  patient_name: string;
  patient_phone: string | null;
  source: "whatsapp" | "messenger" | "website";
  is_ai_handled: boolean;
  last_message: string | null;
  last_message_time: string;
  unread_count: number;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'الآن';
  if (diffMins < 60) return `منذ ${diffMins} د`;
  if (diffHours < 24) return `منذ ${diffHours} ساعة`;
  return `منذ ${diffDays} يوم`;
}

interface ConversationListProps {
  selectedId: string | null;
  onSelect: (conversation: Conversation) => void;
}

const sourceConfig = {
  whatsapp: {
    icon: WhatsAppIcon,
    color: "bg-[#25D366]",
    label: "واتساب"
  },
  messenger: {
    icon: MessengerIcon,
    color: "bg-[#0084FF]",
    label: "ماسنجر"
  },
  website: {
    icon: WebsiteIcon,
    color: "bg-[#6366F1]",
    label: "الموقع"
  }
};

export function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_time', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
    } else {
      setConversations((data || []) as Conversation[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('conversations-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => fetchConversations()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const unreadCount = conversations.filter(c => c.unread_count > 0).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-foreground">المحادثات</h3>
        <p className="text-sm text-muted-foreground">
          {unreadCount} رسائل غير مقروءة
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.map((conversation) => {
          const SourceIcon = sourceConfig[conversation.source]?.icon || WebsiteIcon;
          const sourceColor = sourceConfig[conversation.source]?.color || "bg-gray-500";

          return (
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
                    {conversation.patient_name.charAt(0)}
                  </span>
                </div>
                {/* Source Icon */}
                <div className={cn(
                  "absolute -bottom-1 -left-1 h-5 w-5 rounded-full flex items-center justify-center",
                  sourceColor
                )}>
                  <SourceIcon className="h-3 w-3 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-foreground truncate">
                    {conversation.patient_name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {formatTimeAgo(conversation.last_message_time)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {conversation.last_message || 'لا توجد رسائل'}
                  </p>
                  {conversation.unread_count > 0 && (
                    <Badge className="h-5 min-w-[20px] rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">
                      {conversation.unread_count}
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {conversation.is_ai_handled && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3 text-[hsl(var(--success))]" />
                      <span className="text-xs text-[hsl(var(--success))]">AI يرد</span>
                    </div>
                  )}
                  <Badge variant="outline" className="text-xs px-1.5 py-0">
                    {sourceConfig[conversation.source]?.label || conversation.source}
                  </Badge>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
