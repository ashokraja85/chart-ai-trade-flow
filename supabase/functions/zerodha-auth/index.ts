
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

    console.log('Zerodha auth request:', { action, request_token: request_token ? 'present' : 'missing' });
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    console.log('API Secret available:', apiSecret ? 'Yes' : 'No');

    if (!apiKey || !apiSecret) {
      throw new Error('Zerodha API credentials not configured');
    }

    let responseData: ZerodhaAuthResponse = {};

    switch (action) {
      case 'get_login_url':
        // Generate login URL for user authorization
        const redirectUri = `${req.headers.get('origin')}/`;
        const loginUrl = `https://kite.trade/connect/login?api_key=${apiKey}&v=3`;
        console.log('Generated login URL:', loginUrl);
        responseData = { login_url: loginUrl };
        break;

      case 'generate_session':
        if (!request_token) {
          throw new Error('Request token is required');
        }

        console.log('Generating session with request token:', request_token);
        
        // Generate checksum
        const checksum = await generateChecksum(apiKey, request_token, apiSecret);
        console.log('Generated checksum:', checksum);

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
            checksum: checksum,
          }),
        });

        console.log('Session API response status:', sessionResponse.status);
        
        const responseText = await sessionResponse.text();
        console.log('Session API response text:', responseText);

        if (!sessionResponse.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
          } catch {
            errorData = { message: responseText };
          }
          
          console.error('Session generation failed:', errorData);
          
          // Provide more specific error messages
          if (sessionResponse.status === 403) {
            throw new Error(`Authentication failed: ${errorData.message || 'Invalid API credentials or request token expired'}`);
          } else if (sessionResponse.status === 400) {
            throw new Error(`Invalid request: ${errorData.message || 'Request token may be invalid or expired'}`);
          } else {
            throw new Error(`Session generation failed: ${errorData.message || 'Unknown error'}`);
          }
        }

        const sessionData = JSON.parse(responseText);
        console.log('Session data received:', sessionData.data ? 'Yes' : 'No');
        
        if (!sessionData.data || !sessionData.data.access_token) {
          throw new Error('No access token received from Zerodha');
        }

        responseData = { access_token: sessionData.data.access_token };
        console.log('Access token generated successfully');
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
  console.log('Checksum input data length:', data.length);
  
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  console.log('Generated checksum length:', checksum.length);
  return checksum;
}
