import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, HandMetal, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "./ConversationList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "patient" | "ai" | "doctor";
  created_at: string;
}

interface ChatWindowProps {
  conversation: Conversation | null;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isAiActive, setIsAiActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sendingAi, setSendingAi] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = async () => {
    if (!conversation) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      setMessages((data || []) as Message[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (conversation) {
      fetchMessages();
      setIsAiActive(conversation.is_ai_handled);

      const channel = supabase
        .channel(`messages-${conversation.id}`)
        .on(
          'postgres_changes',
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages',
            filter: `conversation_id=eq.${conversation.id}`
          },
          (payload) => {
            setMessages(prev => [...prev, payload.new as Message]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [conversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation) return;
    
    const messageContent = newMessage;
    setNewMessage("");

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      content: messageContent,
      sender: 'patient'
    });

    if (insertError) {
      console.error('Error sending message:', insertError);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive"
      });
      return;
    }

    await supabase
      .from('conversations')
      .update({
        last_message: messageContent,
        last_message_time: new Date().toISOString(),
        unread_count: (conversation.unread_count || 0) + 1
      })
      .eq('id', conversation.id);

    if (isAiActive) {
      setSendingAi(true);
      try {
        const { data, error } = await supabase.functions.invoke('ai-chat', {
          body: {
            conversationId: conversation.id,
            message: messageContent,
            patientName: conversation.patient_name,
            patientPhone: conversation.patient_phone
          }
        });

        if (error) {
          console.error('AI response error:', error);
          toast({
            title: "تنبيه",
            description: "تعذر الحصول على رد الذكاء الاصطناعي",
            variant: "destructive"
          });
        } else if (data.appointmentBooked) {
          toast({
            title: "تم حجز موعد جديد! 🎉",
            description: `موعد جديد للمريض ${conversation.patient_name}`,
          });
        }
      } catch (err) {
        console.error('Error calling AI:', err);
      }
      setSendingAi(false);
    }
  };

  const handleDoctorReply = async () => {
    if (!newMessage.trim() || !conversation) return;
    
    const messageContent = newMessage;
    setNewMessage("");

    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversation.id,
      content: messageContent,
      sender: 'doctor'
    });

    if (insertError) {
      console.error('Error sending message:', insertError);
      toast({
        title: "خطأ",
        description: "فشل في إرسال الرسالة",
        variant: "destructive"
      });
      return;
    }

    await supabase
      .from('conversations')
      .update({
        last_message: messageContent,
        last_message_time: new Date().toISOString(),
        is_ai_handled: false,
        unread_count: 0
      })
      .eq('id', conversation.id);

    setIsAiActive(false);
  };

  const handleTakeOver = async () => {
    if (!conversation) return;
    
    await supabase
      .from('conversations')
      .update({ is_ai_handled: false })
      .eq('id', conversation.id);

    setIsAiActive(false);
    toast({
      title: "تم",
      description: "أنت الآن ترد على المحادثة"
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/30">
        <div className="text-center p-6">
          <div className="h-14 w-14 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Bot className="h-7 w-7 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">صندوق الوارد الذكي</h3>
          <p className="text-muted-foreground text-sm">
            اختر محادثة للرد
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* AI Status Bar - Mobile optimized */}
      <div className="px-4 py-2 border-b bg-card flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAiActive ? (
            <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] text-xs">
              <Bot className="h-3 w-3 ml-1" />
              AI يرد
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              <User className="h-3 w-3 ml-1" />
              أنت ترد
            </Badge>
          )}
        </div>
        
        {isAiActive && (
          <Button 
            variant="outline" 
            size="sm"
            className="gap-1.5 h-8 text-xs border-[hsl(var(--warning))] text-[hsl(var(--warning))]"
            onClick={handleTakeOver}
          >
            <HandMetal className="h-3.5 w-3.5" />
            <span>تولي</span>
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/20">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8 text-sm">
            لا توجد رسائل بعد
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-2",
                message.sender === "patient" ? "justify-start" : "justify-end"
              )}
            >
              {message.sender === "patient" && (
                <div className="h-7 w-7 rounded-full bg-secondary shrink-0 flex items-center justify-center">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              
              <div
                className={cn(
                  "max-w-[80%] rounded-2xl px-3 py-2 shadow-sm",
                  message.sender === "patient" 
                    ? "bg-card text-foreground rounded-tr-sm" 
                    : message.sender === "ai"
                    ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] rounded-tl-sm"
                    : "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-tl-sm"
                )}
              >
                {message.sender !== "patient" && (
                  <div className="flex items-center gap-1 mb-0.5 opacity-90">
                    {message.sender === "ai" ? (
                      <>
                        <Bot className="h-3 w-3" />
                        <span className="text-[10px]">AI</span>
                      </>
                    ) : (
                      <>
                        <User className="h-3 w-3" />
                        <span className="text-[10px]">أنت</span>
                      </>
                    )}
                  </div>
                )}
                <p className="text-sm whitespace-pre-line">{message.content}</p>
                <span className="text-[10px] opacity-75 mt-1 block">
                  {formatTime(message.created_at)}
                </span>
              </div>

              {message.sender !== "patient" && (
                <div className={cn(
                  "h-7 w-7 rounded-full shrink-0 flex items-center justify-center",
                  message.sender === "ai" 
                    ? "bg-[hsl(var(--success))]" 
                    : "bg-[hsl(var(--primary))]"
                )}>
                  {message.sender === "ai" ? (
                    <Bot className="h-3.5 w-3.5 text-[hsl(var(--success-foreground))]" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-[hsl(var(--primary-foreground))]" />
                  )}
                </div>
              )}
            </div>
          ))
        )}
        {sendingAi && (
          <div className="flex gap-2 justify-end">
            <div className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] rounded-2xl rounded-tl-sm px-3 py-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">جاري الكتابة...</span>
              </div>
            </div>
            <div className="h-7 w-7 rounded-full bg-[hsl(var(--success))] flex items-center justify-center">
              <Bot className="h-3.5 w-3.5 text-[hsl(var(--success-foreground))]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Mobile optimized */}
      <div className="p-3 border-t bg-card safe-area-bottom">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={isAiActive ? "اكتب رسالة للاختبار..." : "اكتب ردك..."}
            className="flex-1 h-11"
            onKeyDown={(e) => e.key === "Enter" && (isAiActive ? handleSend() : handleDoctorReply())}
          />
          <Button 
            onClick={isAiActive ? handleSend : handleDoctorReply} 
            size="icon"
            className="h-11 w-11 shrink-0"
            disabled={sendingAi}
          >
            {sendingAi ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </Button>
        </div>
        {isAiActive && (
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            💡 الرسائل تحاكي رسائل المريض - AI سيرد تلقائياً
          </p>
        )}
      </div>
    </div>
  );
}
