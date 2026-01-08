import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import postgres from "https://deno.land/x/postgresjs/mod.js";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { userId, title, description, dueDate } = await req.json();

        if (!userId || !title) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: userId and title'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!;
        const sql = postgres(databaseUrl);

        // Insert using direct SQL (bypasses PostgREST)
        const result = await sql`
            INSERT INTO public.reminders (user_id, title, description, due_date, is_completed)
            VALUES (${userId}, ${title}, ${description || ''}, ${dueDate || new Date(Date.now() + 3600000).toISOString()}, false)
            RETURNING id
        `;

        await sql.end();

        return new Response(JSON.stringify({
            success: true,
            reminderId: result[0]?.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: unknown) {
        console.error('Error creating reminder:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
