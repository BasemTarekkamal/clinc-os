
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

        // Explicitly grant permissions
        await sql`GRANT ALL ON TABLE public.reminders TO postgres, service_role, anon, authenticated;`;

        // Reload schema cache
        await sql`NOTIFY pgrst, 'reload schema'`;

        return new Response(JSON.stringify({ message: "Permissions granted and schema reloaded" }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
