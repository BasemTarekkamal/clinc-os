
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
        const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!;
        const sql = postgres(databaseUrl);

        await sql`
            CREATE TABLE IF NOT EXISTS public.reminders (
              id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
              user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
              title TEXT NOT NULL,
              description TEXT,
              due_date TIMESTAMP WITH TIME ZONE,
              is_completed BOOLEAN NOT NULL DEFAULT false,
              created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
              updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
            );
        `;

        await sql`ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;`;

        // Policies (ignoring "already exists" errors roughly by simplistic DO blocks or just try/catch individually if running separately, 
        // but simple CREATE POLICY IF NOT EXISTS (postgres 16+ check?) 
        // We'll just run them and ignore errors if they exist.

        try {
            await sql`CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);`;
        } catch (e) { }
        try {
            await sql`CREATE POLICY "Users can insert their own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);`;
        } catch (e) { }
        try {
            await sql`CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);`;
        } catch (e) { }
        try {
            await sql`CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE USING (auth.uid() = user_id);`;
        } catch (e) { }

        return new Response(JSON.stringify({ message: "Table reminders created/verified successfully" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error: unknown) {
        console.error("Error:", error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
