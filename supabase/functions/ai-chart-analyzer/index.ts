import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, symbol, timeframe, metadata } = await req.json();
    
    if (!imageData) {
      return new Response(
        JSON.stringify({ error: 'Image data is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log(`Analyzing chart for ${symbol} (${timeframe})`);

    // Prepare the prompt for GPT-4o Vision
    const prompt = `Analyze this stock chart for ${symbol} and provide a comprehensive trading analysis.

    Chart Context:
    - Symbol: ${symbol}
    - Timeframe: ${timeframe}
    ${metadata ? `- Additional context: ${JSON.stringify(metadata)}` : ''}

    Please analyze the chart and provide:
    1. **Trend Direction**: Bullish/Bearish/Neutral with confidence percentage
    2. **Key Technical Patterns**: Identify any chart patterns (triangles, head & shoulders, cup & handle, etc.)
    3. **Support/Resistance Levels**: Key price levels to watch
    4. **Volume Analysis**: Comment on volume patterns if visible
    5. **Technical Indicators**: Analysis of any visible indicators (RSI, MACD, moving averages)
    6. **Trading Recommendation**: Buy/Sell/Hold with reasoning
    7. **Risk Management**: Suggested entry, target, and stop-loss levels
    8. **Summary**: Brief 2-3 sentence summary for quick reference

    Format your response as a structured JSON object with these exact keys:
    - trend: "bullish" | "bearish" | "neutral"
    - confidence: number (0-100)
    - recommendation: "buy" | "sell" | "hold"
    - patterns: string[] (array of detected patterns)
    - supportLevels: number[]
    - resistanceLevels: number[]
    - entry: number | null
    - target: number | null
    - stopLoss: number | null
    - summary: string
    - insights: string[] (key technical insights)
    - riskLevel: "low" | "medium" | "high"

    Be precise and actionable in your analysis.`;

    // Call OpenAI GPT-4o Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageData,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_tokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to analyze chart with OpenAI' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    const aiResponse = await response.json();
    const analysisText = aiResponse.choices[0].message.content;

    console.log('AI Analysis received:', analysisText);

    // Try to parse the JSON response
    let analysis;
    try {
      // Extract JSON from the response (GPT sometimes adds markdown formatting)
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
      analysis = JSON.parse(jsonString);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback response with raw text
      analysis = {
        trend: 'neutral',
        confidence: 50,
        recommendation: 'hold',
        patterns: [],
        supportLevels: [],
        resistanceLevels: [],
        entry: null,
        target: null,
        stopLoss: null,
        summary: analysisText.substring(0, 200) + '...',
        insights: ['Analysis completed but formatting needs adjustment'],
        riskLevel: 'medium'
      };
    }

    // Store the analysis in the database for future reference
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('ai_usage_logs')
      .insert({
        symbol,
        analysis_type: 'chart_analysis',
        prompt: prompt.substring(0, 500),
        response: JSON.stringify(analysis),
        image_url: null // We don't store the image for privacy
      });

    if (dbError) {
      console.error('Failed to log analysis:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in AI chart analyzer:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to analyze chart', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});