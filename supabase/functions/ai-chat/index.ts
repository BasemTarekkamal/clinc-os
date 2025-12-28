import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, message, patientName } = await req.json();

    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get conversation history
    const { data: messages } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20);

    // Build message history for OpenAI
    const conversationHistory = (messages || []).map((msg: any) => ({
      role: msg.sender === 'patient' ? 'user' : 'assistant',
      content: msg.content
    }));

    // Add current message
    conversationHistory.push({ role: 'user', content: message });

    // Get available appointment slots
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_time')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', endOfDay.toISOString())
      .in('status', ['booked', 'arrived', 'in-consultation']);

    const bookedTimes = (appointments || []).map((a: any) => 
      new Date(a.scheduled_time).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    );

    const systemPrompt = `أنت مساعد طبي ذكي في عيادة طبية. تتحدث العربية بطلاقة.

معلومات مهمة:
- سعر الكشف العادي: 350 جنيه
- سعر الكشف الشامل: 500 جنيه
- سعر المتابعة: 200 جنيه
- المواعيد المحجوزة اليوم: ${bookedTimes.join(', ') || 'لا توجد مواعيد محجوزة'}

يمكنك:
1. الإجابة على أسئلة المرضى عن الأسعار والمواعيد
2. حجز مواعيد جديدة للمرضى
3. تأكيد أو إلغاء المواعيد

عند حجز موعد، استخدم الأداة book_appointment مع الوقت المطلوب.
كن ودوداً ومحترفاً في ردودك.`;

    const tools = [
      {
        type: "function",
        function: {
          name: "book_appointment",
          description: "Book a new appointment for the patient",
          parameters: {
            type: "object",
            properties: {
              time: {
                type: "string",
                description: "The appointment time in HH:MM format (24-hour)"
              },
              is_fast_track: {
                type: "boolean",
                description: "Whether this is a fast-track appointment"
              }
            },
            required: ["time"]
          }
        }
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        tools,
        tool_choice: 'auto',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const assistantMessage = data.choices[0].message;

    let aiResponse = assistantMessage.content || '';
    let appointmentBooked = null;

    // Handle tool calls (appointment booking)
    if (assistantMessage.tool_calls) {
      for (const toolCall of assistantMessage.tool_calls) {
        if (toolCall.function.name === 'book_appointment') {
          const args = JSON.parse(toolCall.function.arguments);
          const timeStr = args.time;
          const isFastTrack = args.is_fast_track || false;

          // Create appointment date
          const appointmentDate = new Date();
          const [hours, minutes] = timeStr.split(':');
          appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Insert appointment
          const { data: newAppointment, error: appointmentError } = await supabase
            .from('appointments')
            .insert({
              patient_name: patientName,
              scheduled_time: appointmentDate.toISOString(),
              status: 'booked',
              is_fast_track: isFastTrack
            })
            .select()
            .single();

          if (appointmentError) {
            console.error('Error creating appointment:', appointmentError);
            aiResponse = 'عذراً، حدث خطأ أثناء حجز الموعد. يرجى المحاولة مرة أخرى.';
          } else {
            appointmentBooked = newAppointment;
            aiResponse = `تم حجز موعدك بنجاح! 🎉\n\nتفاصيل الموعد:\n- الوقت: ${appointmentDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}\n- النوع: ${isFastTrack ? 'مسار سريع' : 'كشف عادي'}\n\nسنراك في الموعد!`;
          }
        }
      }
    }

    // Save AI response to database
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      content: aiResponse,
      sender: 'ai'
    });

    // Update conversation
    await supabase
      .from('conversations')
      .update({
        last_message: aiResponse,
        last_message_time: new Date().toISOString(),
        unread_count: 0
      })
      .eq('id', conversationId);

    return new Response(JSON.stringify({ 
      response: aiResponse,
      appointmentBooked
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-chat function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
