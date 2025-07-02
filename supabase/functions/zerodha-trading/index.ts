import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface OrderRequest {
  tradingsymbol: string;
  exchange: string;
  transaction_type: 'BUY' | 'SELL';
  order_type: 'MARKET' | 'LIMIT';
  quantity: number;
  price?: number;
  product: 'MIS' | 'NRML' | 'CNC';
  variety: 'regular' | 'amo' | 'co' | 'iceberg';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Trading API request at:', new Date().toISOString());
    
    const requestBody = await req.json();
    console.log('Request body received:', requestBody);
    
    const { action, accessToken, access_token, ...params } = requestBody;
    
    // Handle both accessToken and access_token for compatibility
    let token = accessToken || access_token;
    
    // If no token from request, try to get from environment
    if (!token || token.trim() === '') {
      token = Deno.env.get("ZERODHA_ACCESS_TOKEN");
      console.log('Using environment token:', token ? 'Yes' : 'No');
    }
    
    const apiKey = Deno.env.get('ZERODHA_API_KEY') || Deno.env.get('u1qyy1g6dds0szr0');
    
    console.log('API Key available:', apiKey ? 'Yes' : 'No');
    console.log('Token available:', token ? 'Yes' : 'No');
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('ZERODHA_API_KEY is required. Please set it in Supabase secrets.');
    }
    
    if (!token || token.trim() === '') {
      throw new Error('Access token is required. Please authenticate with Zerodha first.');
    }

    let responseData;
    
    switch (action) {
      case 'place_order':
        responseData = await placeOrder(params as OrderRequest, token, apiKey);
        break;
      case 'get_positions':
        responseData = await getPositions(token, apiKey);
        break;
      case 'get_holdings':
        responseData = await getHoldings(token, apiKey);
        break;
      case 'get_orders':
        responseData = await getOrders(token, apiKey);
        break;
      case 'modify_order':
        responseData = await modifyOrder(params, token, apiKey);
        break;
      case 'cancel_order':
        responseData = await cancelOrder(params.order_id, token, apiKey);
        break;
      default:
        throw new Error('Invalid action specified');
    }

    console.log(`${action} completed successfully`);

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
        } 
      }
    );

  } catch (error) {
    console.error('Trading API error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function placeOrder(orderData: OrderRequest, accessToken: string, apiKey: string) {
  console.log('Placing order:', orderData);

  const formData = new URLSearchParams();
  Object.entries(orderData).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  console.log('Order form data:', formData.toString());

  const response = await fetch('https://api.kite.trade/orders/regular', {
    method: 'POST',
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  console.log(`Place order API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Place order API error response:', errorText);
    
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }
    
    throw new Error(`Order placement failed: ${errorData.message || response.statusText}`);
  }

  const data = await response.json();
  console.log('Order placed successfully, order_id:', data.data?.order_id);
  
  return data.data;
}

async function getPositions(accessToken: string, apiKey: string) {
  console.log('Fetching positions');

  const response = await fetch('https://api.kite.trade/portfolio/positions', {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  console.log(`Positions API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Positions API error response:', errorText);
    throw new Error(`Failed to fetch positions: ${errorText}`);
  }

  const data = await response.json();
  console.log('Positions fetched successfully, count:', data.data?.net?.length || 0);
  
  return data.data;
}

async function getHoldings(accessToken: string, apiKey: string) {
  console.log('Fetching holdings');

  const response = await fetch('https://api.kite.trade/portfolio/holdings', {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  console.log(`Holdings API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Holdings API error response:', errorText);
    throw new Error(`Failed to fetch holdings: ${errorText}`);
  }

  const data = await response.json();
  console.log('Holdings fetched successfully, count:', data.data?.length || 0);
  
  return data.data;
}

async function getOrders(accessToken: string, apiKey: string) {
  console.log('Fetching orders');

  const response = await fetch('https://api.kite.trade/orders', {
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  console.log(`Orders API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Orders API error response:', errorText);
    throw new Error(`Failed to fetch orders: ${errorText}`);
  }

  const data = await response.json();
  console.log('Orders fetched successfully, count:', data.data?.length || 0);
  
  return data.data;
}

async function modifyOrder(params: any, accessToken: string, apiKey: string) {
  console.log('Modifying order:', params);

  const { order_id, ...orderData } = params;
  const formData = new URLSearchParams();
  
  Object.entries(orderData).forEach(([key, value]) => {
    if (value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const response = await fetch(`https://api.kite.trade/orders/regular/${order_id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData,
  });

  console.log(`Modify order API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Modify order API error response:', errorText);
    throw new Error(`Order modification failed: ${errorText}`);
  }

  const data = await response.json();
  console.log('Order modified successfully');
  
  return data.data;
}

async function cancelOrder(orderId: string, accessToken: string, apiKey: string) {
  console.log('Canceling order:', orderId);

  const response = await fetch(`https://api.kite.trade/orders/regular/${orderId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `token ${apiKey}:${accessToken}`,
      'X-Kite-Version': '3',
    },
  });

  console.log(`Cancel order API response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Cancel order API error response:', errorText);
    throw new Error(`Order cancellation failed: ${errorText}`);
  }

  const data = await response.json();
  console.log('Order canceled successfully');
  
  return data.data;
}