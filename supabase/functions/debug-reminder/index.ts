
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Parse mock body
        const { userId, title } = await req.json();

        console.log("Attempting insert for:", userId);

        const result = await supabase.from('reminders' as any).insert({
            user_id: userId,
            title: title || 'Debug Reminder',
            description: 'Test description',
            due_date: new Date(Date.now() + 3600000).toISOString(),
            is_completed: false
        }).select();

        return new Response(JSON.stringify({
            success: !result.error,
            data: result.data,
            error: result.error
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
