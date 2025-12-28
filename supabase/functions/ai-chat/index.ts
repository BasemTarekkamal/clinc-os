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
    const { conversationId, message, patientName, patientPhone } = await req.json();

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

    // Get available appointment slots - calculate based on working hours and booked appointments
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch ALL booked appointments for today (statuses that block a slot)
    const { data: appointments } = await supabase
      .from('appointments')
      .select('scheduled_time, status')
      .gte('scheduled_time', now.toISOString())
      .lte('scheduled_time', endOfDay.toISOString());

    // Get booked times (all statuses except cancelled/no-show that block the slot)
    const bookedSlots = (appointments || [])
      .filter((a: any) => ['booked', 'arrived', 'in-consultation', 'waiting'].includes(a.status))
      .map((a: any) => {
        const date = new Date(a.scheduled_time);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
      });

    // Generate all possible slots from 10:00 to 20:00 (every 30 minutes)
    const allSlots: string[] = [];
    for (let hour = 10; hour < 20; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Filter out booked slots and past slots
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const availableSlots = allSlots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      // Skip if already passed
      if (h < currentHour || (h === currentHour && m <= currentMinute)) {
        return false;
      }
      // Skip if already booked
      return !bookedSlots.includes(slot);
    });

    // Format available slots for display in Arabic
    const formatTimeArabic = (slot: string) => {
      const [h, m] = slot.split(':').map(Number);
      const period = h >= 12 ? 'م' : 'ص';
      const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${displayHour}:${m.toString().padStart(2, '0')} ${period}`;
    };

    const availableSlotsArabic = availableSlots.map(formatTimeArabic);
    const bookedSlotsArabic = bookedSlots.map(formatTimeArabic);

    // Egyptian Arabic system prompt
    const systemPrompt = `انت مساعد طبي في عيادة دكتور. بتتكلم مصري عادي زي ما المصريين بيتكلموا.

الشخصية بتاعتك:
- اتكلم بالعامية المصرية (يعني/طيب/حضرتك/ان شاء الله/ماشي)
- كن ودود ولطيف زي ما بتكلم حد من العيلة
- استخدم كلمات زي: أيوه، إزيك، تمام، الحمد لله، معلش

الخطوات اللي لازم تمشي عليها:
1. لو أول مرة تتكلم مع المريض، قول "أهلاً وسهلاً! إزيك؟ ممكن أعرف اسم حضرتك الكريم؟"
2. بعد ما تعرف الاسم، قول "أهلاً يا [الاسم]! ممكن تقولي إيه اللي حاسس بيه أو الشكوى؟"
3. بعد ما تعرف الشكوى، اعرض المواعيد المتاحة واسأله يختار واحد منهم

⚠️ قواعد مهمة جداً للحجز:
- لازم تحجز بس في المواعيد المتاحة المذكورة تحت
- لو المريض طلب وقت مش متاح، قوله "معلش الوقت ده محجوز، المواعيد المتاحة هي: [اذكر المتاح]"
- ممنوع تحجز في أي وقت مش موجود في قائمة المتاح

معلومات العيادة:
- سعر الكشف العادي: 350 جنيه
- سعر الكشف الشامل: 500 جنيه  
- سعر المتابعة: 200 جنيه
- ساعات العمل: من 10 الصبح لـ 8 بالليل
- المواعيد المحجوزة: ${bookedSlotsArabic.join('، ') || 'مفيش مواعيد محجوزة'}
- المواعيد المتاحة للحجز: ${availableSlotsArabic.length > 0 ? availableSlotsArabic.join('، ') : 'للأسف مفيش مواعيد متاحة النهاردة'}

لما تحجز موعد:
- استخدم الأداة book_appointment
- لازم تبعت الشكوى الطبية في chief_complaint
- لو المريض قال اسمه، ابعته في patient_name_from_chat
- استخدم فقط الأوقات المتاحة المذكورة أعلاه

أمثلة على طريقة الكلام:
- "تمام يا فندم، المواعيد المتاحة عندنا هي ${availableSlotsArabic.slice(0, 3).join(' و')}، تحب أحجزلك أنهي واحد؟"
- "ربنا يشفيك ويعافيك، هنستناك في العيادة"
- "معلش على اللي بتحس بيه، بس متقلقش هنساعدك"`;

    const tools = [
      {
        type: "function",
        function: {
          name: "book_appointment",
          description: "Book a new appointment for the patient. Use this when patient agrees to book.",
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
              },
              chief_complaint: {
                type: "string",
                description: "The patient's main complaint or symptoms in Arabic"
              },
              patient_name_from_chat: {
                type: "string",
                description: "The patient's name if they provided it during the conversation"
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
          const chiefComplaint = args.chief_complaint || null;
          const patientNameFromChat = args.patient_name_from_chat || patientName;

          // Create appointment date
          const appointmentDate = new Date();
          const [hours, minutes] = timeStr.split(':');
          appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

          // Try to find or create patient
          let patientId = null;
          
          // First try to find by phone
          if (patientPhone) {
            const { data: existingPatient } = await supabase
              .from('patients')
              .select('id')
              .eq('phone', patientPhone)
              .single();
            
            if (existingPatient) {
              patientId = existingPatient.id;
              console.log('Found existing patient by phone:', patientId);
            }
          }

          // If no patient found, create one
          if (!patientId) {
            const { data: newPatient, error: patientError } = await supabase
              .from('patients')
              .insert({
                name: patientNameFromChat,
                name_ar: patientNameFromChat,
                age: 0, // Unknown, will be updated later
                gender: 'male', // Default, will be updated later
                phone: patientPhone || null,
                chronic_conditions: chiefComplaint ? [chiefComplaint] : []
              })
              .select()
              .single();

            if (patientError) {
              console.error('Error creating patient:', patientError);
            } else {
              patientId = newPatient.id;
              console.log('Created new patient:', patientId);
            }
          }

          // Insert appointment with patient_id
          const { data: newAppointment, error: appointmentError } = await supabase
            .from('appointments')
            .insert({
              patient_name: patientNameFromChat,
              patient_id: patientId,
              scheduled_time: appointmentDate.toISOString(),
              status: 'booked',
              is_fast_track: isFastTrack
            })
            .select()
            .single();

          if (appointmentError) {
            console.error('Error creating appointment:', appointmentError);
            aiResponse = 'معلش يا فندم، في مشكلة حصلت وانا بحجزلك. ممكن تجرب تاني؟';
          } else {
            appointmentBooked = newAppointment;
            const timeFormatted = appointmentDate.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
            aiResponse = `تمام يا ${patientNameFromChat}! 🎉 حجزتلك موعد

📅 الميعاد: النهاردة الساعة ${timeFormatted}
${isFastTrack ? '⚡ مسار سريع' : '🏥 كشف عادي'}
${chiefComplaint ? `📝 الشكوى: ${chiefComplaint}` : ''}

هنستناك في العيادة يا فندم! ربنا يشفيك 💚`;
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
