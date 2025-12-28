import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting reminder check...");
    
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get reminder settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("clinic_settings")
      .select("setting_value")
      .eq("setting_key", "reminder_settings")
      .single();

    if (settingsError) {
      console.error("Error fetching settings:", settingsError);
      throw new Error("Failed to fetch reminder settings");
    }

    const settings = settingsData?.setting_value as {
      enabled: boolean;
      sms_enabled: boolean;
      whatsapp_enabled: boolean;
      minutes_before: number;
    };

    if (!settings?.enabled) {
      console.log("Reminders are disabled");
      return new Response(JSON.stringify({ message: "Reminders are disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!settings.sms_enabled && !settings.whatsapp_enabled) {
      console.log("No notification channels enabled");
      return new Response(JSON.stringify({ message: "No notification channels enabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if Twilio is configured
    if (settings.sms_enabled && (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER)) {
      console.log("Twilio not configured");
      return new Response(JSON.stringify({ message: "Twilio not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate time window for reminders
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + (settings.minutes_before - 5) * 60 * 1000);
    const reminderWindowEnd = new Date(now.getTime() + (settings.minutes_before + 5) * 60 * 1000);

    console.log(`Looking for appointments between ${reminderWindowStart.toISOString()} and ${reminderWindowEnd.toISOString()}`);

    // Get appointments that need reminders
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        patient_name,
        patient_id,
        scheduled_time,
        is_fast_track,
        patients (
          phone,
          name_ar
        )
      `)
      .eq("status", "booked")
      .eq("reminder_sent", false)
      .gte("scheduled_time", reminderWindowStart.toISOString())
      .lte("scheduled_time", reminderWindowEnd.toISOString());

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw new Error("Failed to fetch appointments");
    }

    console.log(`Found ${appointments?.length || 0} appointments needing reminders`);

    const results: { appointmentId: string; success: boolean; error?: string }[] = [];

    for (const appointment of appointments || []) {
      const patientData = appointment.patients as unknown as { phone: string; name_ar: string }[] | null;
      const patient = patientData && patientData.length > 0 ? patientData[0] : null;
      const phoneNumber = patient?.phone;

      if (!phoneNumber) {
        console.log(`No phone number for appointment ${appointment.id}`);
        results.push({ appointmentId: appointment.id, success: false, error: "No phone number" });
        continue;
      }

      // Format the scheduled time
      const scheduledDate = new Date(appointment.scheduled_time);
      const timeString = scheduledDate.toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const patientName = patient?.name_ar || appointment.patient_name || "المريض";
      const message = `مرحباً ${patientName}! 🏥\n\nتذكير: موعدك في العيادة الساعة ${timeString}.\n\nنستناك! 💚`;

      console.log(`Sending reminder to ${phoneNumber} for appointment ${appointment.id}`);

      try {
        if (settings.sms_enabled && TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER) {
          // Format phone number for Twilio (ensure it has country code)
          let formattedPhone = phoneNumber.replace(/\s+/g, "");
          if (!formattedPhone.startsWith("+")) {
            if (formattedPhone.startsWith("0")) {
              formattedPhone = "+2" + formattedPhone; // Egypt country code
            } else {
              formattedPhone = "+20" + formattedPhone;
            }
          }

          const twilioResponse = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: "POST",
              headers: {
                "Authorization": `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                From: TWILIO_PHONE_NUMBER,
                To: formattedPhone,
                Body: message,
              }),
            }
          );

          if (!twilioResponse.ok) {
            const errorData = await twilioResponse.text();
            console.error(`Twilio error for ${appointment.id}:`, errorData);
            results.push({ appointmentId: appointment.id, success: false, error: errorData });
            continue;
          }

          const twilioData = await twilioResponse.json();
          console.log(`SMS sent successfully: ${twilioData.sid}`);
        }

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ reminder_sent: true })
          .eq("id", appointment.id);

        if (updateError) {
          console.error(`Error updating appointment ${appointment.id}:`, updateError);
        }

        results.push({ appointmentId: appointment.id, success: true });
      } catch (sendError) {
        console.error(`Error sending reminder for ${appointment.id}:`, sendError);
        results.push({ 
          appointmentId: appointment.id, 
          success: false, 
          error: sendError instanceof Error ? sendError.message : "Unknown error" 
        });
      }
    }

    console.log("Reminder check complete:", results);

    return new Response(JSON.stringify({ 
      message: "Reminder check complete",
      results,
      totalProcessed: results.length,
      successful: results.filter(r => r.success).length,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in send-reminder function:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
