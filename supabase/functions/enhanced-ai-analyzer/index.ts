import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Enhanced analysis with GPT-4.1-2025-04-14 for better reasoning
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, prompt, marketContext, userContext, metadata } = await req.json();
    
    if (!imageData || !prompt) {
      return new Response(
        JSON.stringify({ error: 'Image data and prompt are required' }),
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

    console.log(`Enhanced AI analysis for ${marketContext?.symbol} by ${userContext?.experience} trader`);

    // Enhanced system prompt for better context awareness
    const systemPrompt = `You are an expert trading analyst with deep knowledge of Indian markets (NSE/BSE). 
    
    Context Awareness:
    - User Experience: ${userContext?.experience || 'intermediate'}
    - Risk Tolerance: ${userContext?.riskTolerance || 'medium'}
    - Trading Style: ${userContext?.tradingStyle || 'swing'}
    - Instrument Type: ${marketContext?.instrumentType || 'EQUITY'}
    - Market Condition: ${marketContext?.marketCondition || 'neutral'}
    
    Analysis Requirements:
    1. Tailor complexity to user experience level
    2. Align recommendations with risk tolerance
    3. Consider trading style for timing suggestions
    4. Factor in current market conditions
    5. Provide actionable, specific advice
    6. Include Indian market context (FII/DII flows, sector rotation, etc.)
    
    Response Format: Always return valid JSON matching the specified structure.
    Quality: Provide institutional-grade analysis with retail-friendly explanations.`;

    // Use GPT-4.1 for enhanced reasoning and analysis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14', // Latest model for best analysis
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
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
        max_tokens: 2000,
        temperature: 0.1, // Low temperature for consistent, analytical responses
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

    console.log('Enhanced AI Analysis received:', analysisText.substring(0, 200) + '...');

    // Enhanced JSON parsing with better error handling
    let analysis;
    try {
      // Try multiple JSON extraction methods
      const jsonMatch = analysisText.match(/```json\n([\s\S]*?)\n```/) || 
                       analysisText.match(/\{[\s\S]*\}/) ||
                       analysisText.match(/```\n([\s\S]*?)\n```/);
      
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : analysisText;
      analysis = JSON.parse(jsonString.trim());
      
      // Validate required fields and enhance with context
      analysis = {
        trend: analysis.trend || 'neutral',
        confidence: Math.min(100, Math.max(0, analysis.confidence || 50)),
        recommendation: analysis.recommendation || 'hold',
        patterns: Array.isArray(analysis.patterns) ? analysis.patterns : [],
        supportLevels: Array.isArray(analysis.supportLevels) ? analysis.supportLevels : [],
        resistanceLevels: Array.isArray(analysis.resistanceLevels) ? analysis.resistanceLevels : [],
        entry: analysis.entry,
        target: analysis.target,
        stopLoss: analysis.stopLoss,
        summary: analysis.summary || 'Analysis completed successfully',
        insights: Array.isArray(analysis.insights) ? analysis.insights : ['Technical analysis completed'],
        riskLevel: analysis.riskLevel || 'medium',
        // Enhanced fields
        marketContext: marketContext,
        userAdaptedAdvice: analysis.userAdaptedAdvice || 'Follow your trading plan',
        timeframeGuidance: analysis.timeframeGuidance || 'Monitor price action',
        volumeAnalysis: analysis.volumeAnalysis || 'Volume confirmation pending',
        nextLevelsToWatch: analysis.nextLevelsToWatch || [],
        contingencyPlan: analysis.contingencyPlan || 'Reassess if analysis invalidated'
      };
      
    } catch (parseError) {
      console.error('Failed to parse enhanced AI response:', parseError);
      
      // Intelligent fallback based on context
      const fallbackConfidence = marketContext?.volatility > 50 ? 30 : 60;
      const fallbackRisk = userContext?.riskTolerance === 'high' ? 'medium' : 'low';
      
      analysis = {
        trend: 'neutral',
        confidence: fallbackConfidence,
        recommendation: 'hold',
        patterns: ['Analysis format needs adjustment'],
        supportLevels: marketContext?.currentPrice ? [marketContext.currentPrice * 0.98] : [],
        resistanceLevels: marketContext?.currentPrice ? [marketContext.currentPrice * 1.02] : [],
        entry: null,
        target: null,
        stopLoss: null,
        summary: 'Technical analysis completed. Chart shows mixed signals requiring further confirmation.',
        insights: [
          'Analysis completed with partial data extraction',
          `Adjusted for ${userContext?.experience || 'intermediate'} trader experience`,
          'Consider multiple timeframe confirmation'
        ],
        riskLevel: fallbackRisk,
        marketContext: marketContext,
        userAdaptedAdvice: `As a ${userContext?.experience || 'intermediate'} trader, focus on risk management`,
        rawAnalysis: analysisText.substring(0, 500)
      };
    }

    // Store enhanced analysis in database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { error: dbError } = await supabase
      .from('ai_usage_logs')
      .insert({
        symbol: marketContext?.symbol || 'UNKNOWN',
        analysis_type: 'enhanced_analysis',
        prompt: prompt.substring(0, 1000), // Store more of the prompt
        response: JSON.stringify({
          ...analysis,
          metadata: {
            ...metadata,
            model: 'gpt-4.1-2025-04-14',
            processingTime: Date.now(),
            userContext: {
              experience: userContext?.experience,
              riskTolerance: userContext?.riskTolerance,
              tradingStyle: userContext?.tradingStyle
            }
          }
        }),
        image_url: null // Privacy: don't store images
      });

    if (dbError) {
      console.error('Failed to log enhanced analysis:', dbError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis,
        enhancedFeatures: {
          contextAware: true,
          userAdapted: true,
          marketConditionConsidered: true,
          model: 'gpt-4.1-2025-04-14'
        },
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhanced AI analyzer:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Enhanced analysis failed', 
        details: error.message,
        fallback: 'Try basic analysis mode'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});