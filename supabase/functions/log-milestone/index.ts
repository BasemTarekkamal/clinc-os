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
        const { userId, childName, milestone, category, ageRange } = await req.json();

        if (!userId || !milestone) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Missing required fields: userId and milestone'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const databaseUrl = Deno.env.get('SUPABASE_DB_URL')!;
        const sql = postgres(databaseUrl);

        // 1. Find Child
        // We need to find the child belonging to this user that matches the name
        // If no name provided and only one child exists, use that.

        let childId = null;
        let childNameFound = null;

        const children = await sql`
            SELECT id, name FROM public.children WHERE parent_id = ${userId}
        `;

        if (children.length === 0) {
            await sql.end();
            return new Response(JSON.stringify({ success: false, error: 'No children found for user' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (childName) {
            const match = children.find((c: any) => c.name.toLowerCase().includes(childName.toLowerCase()));
            if (match) {
                childId = match.id;
                childNameFound = match.name;
            }
        } else if (children.length === 1) {
            childId = children[0].id;
            childNameFound = children[0].name;
        }

        if (!childId) {
            await sql.end();
            return new Response(JSON.stringify({
                success: false,
                error: `Could not find child named '${childName}'. Available: ${children.map((c: any) => c.name).join(', ')}`
            }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // 2. Insert Milestone
        await sql`
            INSERT INTO public.child_milestones (child_id, milestone_id, description, category, age_range, achieved_at)
            VALUES (${childId}, 'custom_ai_log', ${milestone}, ${category || 'general'}, ${ageRange || 'custom'}, ${new Date().toISOString()})
        `;

        await sql.end();

        return new Response(JSON.stringify({
            success: true,
            childId: childId,
            childName: childNameFound,
            message: `Logged milestone for ${childNameFound}`
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error logging milestone:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
