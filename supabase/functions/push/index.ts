// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
    title: string;
    message: string;
    token?: string; // Specific device token
    topic?: string; // Topic fallback
}

// Get the FCM Server Key from Supabase secrets
const FCM_SERVER_KEY = Deno.env.get('FIREBASE_SERVER_KEY');

serve(async (req: Request) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { title, message, token, topic } = await req.json() as NotificationRequest;

        if (!FCM_SERVER_KEY) {
            throw new Error('FIREBASE_SERVER_KEY is not set in Edge Function secrets.');
        }

        if (!token && !topic) {
            throw new Error('Missing "token" or "topic" in request body.');
        }

        const payload = {
            notification: {
                title: title,
                body: message,
            },
            data: {
                url: '/notifications',
            },
        };

        if (token) {
            payload['to'] = token;
        } else {
            payload['to'] = `/topics/${topic}`;
        }

        console.log(`Sending Push to ${token ? 'token' : 'topic'}:`, JSON.stringify(payload));

        const response = await fetch('https://fcm.googleapis.com/fcm/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `key=${FCM_SERVER_KEY}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        console.log('FCM Response:', data);

        return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        console.error("Error sending push:", error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
        });
    }
});
