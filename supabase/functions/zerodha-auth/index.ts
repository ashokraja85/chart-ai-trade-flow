
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ZerodhaAuthResponse {
  login_url?: string;
  access_token?: string;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, request_token } = await req.json();
    const apiKey = Deno.env.get('ZERODHA_API_KEY');
    const apiSecret = Deno.env.get('ZERODHA_API_SECRET');

    if (!apiKey || !apiSecret) {
      throw new Error('Zerodha API credentials not configured');
    }

    let responseData: ZerodhaAuthResponse = {};

    switch (action) {
      case 'get_login_url':
        // Generate login URL for user authorization
        const redirectUri = `${req.headers.get('origin')}/zerodha-callback`;
        const loginUrl = `https://kite.trade/connect/login?api_key=${apiKey}&v=3`;
        responseData = { login_url: loginUrl };
        break;

      case 'generate_session':
        if (!request_token) {
          throw new Error('Request token is required');
        }

        // Generate session using request token
        const sessionResponse = await fetch('https://api.kite.trade/session/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Kite-Version': '3',
          },
          body: new URLSearchParams({
            api_key: apiKey,
            request_token: request_token,
            checksum: await generateChecksum(apiKey, request_token, apiSecret),
          }),
        });

        if (!sessionResponse.ok) {
          const errorData = await sessionResponse.json();
          throw new Error(`Session generation failed: ${errorData.message || 'Unknown error'}`);
        }

        const sessionData = await sessionResponse.json();
        responseData = { access_token: sessionData.data.access_token };
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Zerodha auth error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function generateChecksum(apiKey: string, requestToken: string, apiSecret: string): Promise<string> {
  const data = apiKey + requestToken + apiSecret;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
