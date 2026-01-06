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
        const { sessionId, message, userId } = await req.json();

        if (!OPENAI_API_KEY) {
            throw new Error('OPENAI_API_KEY is not configured');
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Get or Create Session (Thread)
        let threadId = null;
        let currentSessionId = sessionId;

        if (currentSessionId) {
            const { data: session } = await supabase
                .from('chat_sessions')
                .select('initial_prompt')
                .eq('id', currentSessionId)
                .single();

            if (session?.initial_prompt) {
                threadId = session.initial_prompt;
            }
        }

        // Create new thread if not exist
        if (!threadId) {
            const threadResponse = await fetch('https://api.openai.com/v1/threads', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                    'OpenAI-Beta': 'assistants=v2',
                },
            });
            const threadData = await threadResponse.json();
            threadId = threadData.id;

            // If no currentSessionId, create it
            if (!currentSessionId) {
                const { data: newSession } = await supabase
                    .from('chat_sessions')
                    .insert({
                        user_id: userId,
                        initial_prompt: threadId, // Storing threadId here
                        name: message.substring(0, 50) + (message.length > 50 ? '...' : ''), // Initial name
                    })
                    .select()
                    .single();
                currentSessionId = newSession.id;
            } else {
                // Update existing session with threadId
                await supabase
                    .from('chat_sessions')
                    .update({ initial_prompt: threadId })
                    .eq('id', currentSessionId);
            }
        }

        // Add Message to Thread
        await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify({
                role: 'user',
                content: message,
            }),
        });

        // Run Assistant
        const runResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
                'OpenAI-Beta': 'assistants=v2',
            },
            body: JSON.stringify({
                assistant_id: ASSISTANT_ID,
            }),
        });
        let runData = await runResponse.json();

        // Poll for completion
        while (runData.status === 'queued' || runData.status === 'in_progress' || runData.status === 'busy') {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const pollResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runData.id}`, {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'OpenAI-Beta': 'assistants=v2',
                },
            });
            runData = await pollResponse.json();
        }

        if (runData.status !== 'completed') {
            console.error('Run failed:', runData);
            throw new Error(`AI assistant run failed with status: ${runData.status}`);
        }

        // Get Messages
        const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
            headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'OpenAI-Beta': 'assistants=v2',
            },
        });
        if (!messagesResponse.ok) {
            const errorBody = await messagesResponse.text();
            throw new Error(`Failed to retrieve messages: ${messagesResponse.status} ${messagesResponse.statusText} - ${errorBody}`);
        }
        const messagesData = await messagesResponse.json();
        const assistantMessage = messagesData.data.find((m: any) => m.role === 'assistant');

        if (!assistantMessage || !assistantMessage.content || !assistantMessage.content[0] || !assistantMessage.content[0].text || !assistantMessage.content[0].text.value) {
            throw new Error('Could not find assistant message or its content.');
        }
        const aiResponse = assistantMessage.content[0].text.value;

        // Log messages to database
        if (!currentSessionId) {
            throw new Error('Session ID is missing after creation/retrieval.');
        }
        const { error: logError } = await supabase.from('chat_messages').insert([
            { session_id: currentSessionId, content: message, role: 'user' },
            { session_id: currentSessionId, content: aiResponse, role: 'assistant' }
        ]);
        if (logError) {
            console.error('Error logging messages:', logError);
            throw new Error(`Failed to log messages: ${logError.message}`);
        }

        // Generate Title if it's a new session or still has default title
        const { data: sessionData, error: sessionNameError } = await supabase
            .from('chat_sessions')
            .select('name')
            .eq('id', currentSessionId)
            .single();

        if (sessionNameError && sessionNameError.code !== 'PGRST116') {
            console.error('Error fetching session name:', sessionNameError);
            throw new Error(`Failed to fetch session name: ${sessionNameError.message}`);
        }

        if (!sessionData?.name || sessionData.name.includes('...')) {
            const titleResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: 'أنت مساعد يقوم بإنشاء عنوان قصير ومختصر جداً (بحد أقصى 4 كلمات) لمحادثة طبية بناءً على رسالة المستخدم. العنوان يجب أن يكون باللغة العربية.' },
                        { role: 'user', content: `أنشئ عنواناً لهذه الرسالة: ${message}` }
                    ],
                    max_tokens: 10,
                }),
            });

            if (!titleResponse.ok) {
                const errorBody = await titleResponse.text();
                console.error('Error generating title:', errorBody);
                throw new Error(`Failed to generate title: ${titleResponse.status} ${titleResponse.statusText} - ${errorBody}`);
            }

            const titleData = await titleResponse.json();
            if (!titleData.choices || titleData.choices.length === 0 || !titleData.choices[0].message || !titleData.choices[0].message.content) {
                console.warn('OpenAI title generation response missing expected data:', titleData);
                // Continue without updating title if generation failed
            } else {
                const generatedTitle = titleData.choices[0].message.content.trim().replace(/^"|"$/g, '');

                const { error: updateTitleError } = await supabase
                    .from('chat_sessions')
                    .update({ name: generatedTitle })
                    .eq('id', currentSessionId);

                if (updateTitleError) {
                    console.error('Error updating session title:', updateTitleError);
                    // Log error but don't block response
                }
            }
        }

        return new Response(JSON.stringify({
            response: aiResponse,
            sessionId: currentSessionId
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error) {
        console.error('Error in assistant-chat function:', error);
        return new Response(JSON.stringify({ error: (error as Error).message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
