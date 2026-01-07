
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
const ASSISTANT_ID = 'asst_RbgpJfC4JIpYcSMTSnOdmQSt';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, sessionId, userId } = await req.json();
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Fetch Context (Profile + Children)
        const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', userId).single();
        const { data: children } = await supabase.from('children').select('name, date_of_birth, gender').eq('parent_id', userId);

        let contextString = `Current User: ${profile?.full_name || 'Unknown'}\n`;
        if (children && children.length > 0) {
            contextString += "Children:\n";
            children.forEach((child: any) => {
                contextString += `- ${child.name} (${child.gender}, Born: ${child.date_of_birth})\n`;
            });
        } else {
            contextString += "No children registered yet.\n";
        }

        let threadId;
        let currentSessionId = sessionId;

        if (!currentSessionId) {
            // Create New Session
            const run = await fetch('https://api.openai.com/v1/threads', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2',
                }
            }).then(r => r.json());

            threadId = run.id;

            // Generate Title
            let title = "محادثة جديدة";
            try {
                const titleRes = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: 'gpt-4o-mini',
                        messages: [
                            { role: 'system', content: 'Create a 3-4 word Arabic title for this message.' },
                            { role: 'user', content: message }
                        ],
                        max_tokens: 15,
                    }),
                }).then(r => r.json());
                if (titleRes.choices?.[0]?.message?.content) {
                    title = titleRes.choices[0].message.content.replace(/"/g, '');
                }
            } catch (e) {
                console.error("Title gen error:", e);
            }

            const { data: sessionData, error } = await supabase
                .from('chat_sessions')
                .insert({ user_id: userId, initial_prompt: threadId, name: title })
                .select()
                .single();

            if (error) throw error;
            currentSessionId = sessionData.id;

            // Seed Context
            await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2',
                },
                body: JSON.stringify({
                    role: "user",
                    content: `CONTEXT (System Note):\n${contextString}\n\nUser Question: ${message}`
                })
            });

        } else {
            const { data } = await supabase.from('chat_sessions').select('initial_prompt').eq('id', currentSessionId).single();
            threadId = data.initial_prompt;

            await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2',
                },
                body: JSON.stringify({ role: "user", content: message })
            });
        }

        // Run with Tools
        const tools = [{
            type: "function",
            function: {
                name: "set_reminder",
                description: "Set a reminder for the user. Use this when the user asks to be reminded about something (e.g., medication, appointment).",
                parameters: {
                    type: "object",
                    properties: {
                        title: { type: "string", description: "Short title for the reminder" },
                        due_date_iso: { type: "string", description: "ISO 8601 formatted date-time. Calculate this based on relative time (e.g. 'in 4 hours')." },
                        description: { type: "string", description: "Optional details" }
                    },
                    required: ["title"]
                }
            }
        },
        {
            type: "function",
            function: {
                name: "log_milestone",
                description: "Log a developmental milestone for a child. Use this when the user says their child did something new (e.g. 'Basem started walking', 'Ahmed smiled').",
                parameters: {
                    type: "object",
                    properties: {
                        child_name: { type: "string", description: "The name of the child (e.g. Basem, Ahmed)" },
                        milestone: { type: "string", description: "Description of the milestone (e.g. 'started walking', 'first smile')" },
                        category: { type: "string", enum: ["physical", "social"], description: "Category of the milestone" },
                        age_range: { type: "string", description: "Approximate age range or 'custom' if unknown" }
                    },
                    required: ["child_name", "milestone", "category"]
                }
            }
        }];

        let run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify({ assistant_id: ASSISTANT_ID, tools })
        }).then(r => r.json());

        // Polling
        while (['queued', 'in_progress', 'requires_action'].includes(run.status)) {
            await new Promise(r => setTimeout(r, 1000));
            run = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}`, {
                headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'OpenAI-Beta': 'assistants=v2' }
            }).then(r => r.json());

            if (run.status === 'requires_action') {
                let debugError = null;

                const toolOutputs = [];
                for (const call of run.required_action.submit_tool_outputs.tool_calls) {
                    if (call.function.name === 'set_reminder') {
                        const args = JSON.parse(call.function.arguments);
                        let dueDate = new Date(Date.now() + 3600000); // Default 1 hour
                        if (args.due_date_iso) {
                            const parsed = new Date(args.due_date_iso);
                            if (!isNaN(parsed.getTime())) {
                                dueDate = parsed;
                            }
                        }

                        // Call dedicated Edge Function instead of direct DB access
                        try {
                            const response = await fetch(`${SUPABASE_URL}/functions/v1/create-reminder`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                                },
                                body: JSON.stringify({
                                    userId: userId,
                                    title: args.title || 'Reminder',
                                    description: args.description || '',
                                    dueDate: dueDate.toISOString()
                                })
                            });

                            const result = await response.json();

                            if (result.success) {
                                toolOutputs.push({
                                    tool_call_id: call.id,
                                    output: "Reminder saved successfully!"
                                });
                            } else {
                                debugError = `EDGE_FN_ERR: ${result.error}`;
                                toolOutputs.push({
                                    tool_call_id: call.id,
                                    output: `Error: ${result.error}`
                                });
                            }
                        } catch (fetchError: any) {
                            debugError = `FETCH_ERR: ${fetchError.message}`;
                            toolOutputs.push({
                                tool_call_id: call.id,
                                output: `Error: ${fetchError.message}`
                            });
                        }
                    } else if (call.function.name === 'log_milestone') {
                        const args = JSON.parse(call.function.arguments);

                        try {
                            const response = await fetch(`${SUPABASE_URL}/functions/v1/log-milestone`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
                                },
                                body: JSON.stringify({
                                    userId: userId,
                                    childName: args.child_name,
                                    milestone: args.milestone,
                                    category: args.category,
                                    ageRange: args.age_range
                                })
                            });

                            const result = await response.json();

                            if (result.success) {
                                toolOutputs.push({
                                    tool_call_id: call.id,
                                    output: `Logged milestone for ${result.childName || 'child'}`
                                });
                            } else {
                                toolOutputs.push({
                                    tool_call_id: call.id,
                                    output: `Error: ${result.error}`
                                });
                            }
                        } catch (fetchError: any) {
                            toolOutputs.push({
                                tool_call_id: call.id,
                                output: `Error: ${fetchError.message}`
                            });
                        }
                    }
                }

                // Submit outputs
                await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${run.id}/submit_tool_outputs`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json', 'OpenAI-Beta': 'assistants=v2' },
                    body: JSON.stringify({ tool_outputs: toolOutputs })
                });
            }
        }

        if (run.status !== 'completed') {
            console.error('Run failed:', run);
            throw new Error(`Run status: ${run.status}`);
        }

        // Get Messages
        const messages = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'OpenAI-Beta': 'assistants=v2' }
        }).then(r => r.json());

        const responseText = messages.data[0].content[0].text.value;

        // Log
        await supabase.from('chat_messages').insert([
            { session_id: currentSessionId, role: 'user', content: message },
            { session_id: currentSessionId, role: 'assistant', content: responseText }
        ]);

        return new Response(JSON.stringify({ response: responseText, sessionId: currentSessionId }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
});
