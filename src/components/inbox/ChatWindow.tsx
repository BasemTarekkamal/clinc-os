import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, HandMetal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Conversation } from "./ConversationList";

interface Message {
  id: string;
  content: string;
  sender: "patient" | "ai" | "doctor";
  time: string;
}

const mockMessages: Message[] = [
  {
    id: "1",
    content: "السلام عليكم، عايز أعرف سعر الكشف لو سمحت",
    sender: "patient",
    time: "12:30",
  },
  {
    id: "2",
    content: "وعليكم السلام! سعر الكشف العادي 350 جنيه، والكشف الشامل 500 جنيه. هل تريد حجز موعد؟",
    sender: "ai",
    time: "12:30",
  },
  {
    id: "3",
    content: "تمام، وإيه المواعيد المتاحة النهاردة؟",
    sender: "patient",
    time: "12:32",
  },
  {
    id: "4",
    content: "لدينا مواعيد متاحة اليوم:\n• 2:00 مساءً\n• 3:30 مساءً\n• 5:00 مساءً\n\nأي موعد تفضل؟",
    sender: "ai",
    time: "12:32",
  },
];

interface ChatWindowProps {
  conversation: Conversation | null;
}

export function ChatWindow({ conversation }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState("");
  const [isAiActive, setIsAiActive] = useState(true);

  const handleSend = () => {
    if (!newMessage.trim()) return;
    
    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: "doctor",
      time: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };
    
    setMessages([...messages, message]);
    setNewMessage("");
    setIsAiActive(false);
  };

  const handleTakeOver = () => {
    setIsAiActive(false);
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4">
            <Bot className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground mb-2">صندوق الوارد الذكي</h3>
          <p className="text-muted-foreground text-sm max-w-xs">
            اختر محادثة للرد، أو دع الذكاء الاصطناعي يتولى الرد التلقائي
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b bg-card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center">
            <span className="font-medium text-secondary-foreground">
              {conversation.name.charAt(0)}
            </span>
          </div>
          <div>
            <h4 className="font-semibold text-foreground">{conversation.name}</h4>
            <div className="flex items-center gap-2">
              {isAiActive ? (
                <Badge className="bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] text-xs">
                  <Bot className="h-3 w-3 ml-1" />
                  AI يرد تلقائياً
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  <User className="h-3 w-3 ml-1" />
                  أنت ترد
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {isAiActive && (
          <Button 
            variant="outline" 
            className="gap-2 border-[hsl(var(--warning))] text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))] hover:text-[hsl(var(--warning-foreground))]"
            onClick={handleTakeOver}
          >
            <HandMetal className="h-4 w-4" />
            <span>تولي المحادثة</span>
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-secondary/20">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex gap-2",
              message.sender === "patient" ? "justify-start" : "justify-end"
            )}
          >
            {message.sender === "patient" && (
              <div className="h-8 w-8 rounded-full bg-secondary shrink-0 flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-3 shadow-sm",
                message.sender === "patient" 
                  ? "bg-card text-foreground rounded-tr-sm" 
                  : message.sender === "ai"
                  ? "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] rounded-tl-sm"
                  : "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-tl-sm"
              )}
            >
              {message.sender !== "patient" && (
                <div className="flex items-center gap-1 mb-1 opacity-90">
                  {message.sender === "ai" ? (
                    <>
                      <Bot className="h-3 w-3" />
                      <span className="text-xs">AI Assistant</span>
                    </>
                  ) : (
                    <>
                      <User className="h-3 w-3" />
                      <span className="text-xs">أنت</span>
                    </>
                  )}
                </div>
              )}
              <p className="text-sm whitespace-pre-line">{message.content}</p>
              <span className="text-xs opacity-75 mt-1 block">
                {message.time}
              </span>
            </div>

            {message.sender !== "patient" && (
              <div className={cn(
                "h-8 w-8 rounded-full shrink-0 flex items-center justify-center",
                message.sender === "ai" 
                  ? "bg-[hsl(var(--success))]" 
                  : "bg-[hsl(var(--primary))]"
              )}>
                {message.sender === "ai" ? (
                  <Bot className="h-4 w-4 text-[hsl(var(--success-foreground))]" />
                ) : (
                  <User className="h-4 w-4 text-[hsl(var(--primary-foreground))]" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-card">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="اكتب رسالتك..."
            className="flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button onClick={handleSend} className="gap-2">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        {isAiActive && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            💡 اكتب رسالة لتولي المحادثة من الذكاء الاصطناعي
          </p>
        )}
      </div>
    </div>
  );
}
