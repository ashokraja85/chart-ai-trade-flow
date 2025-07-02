import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  PromptTemplate, 
  MarketContext, 
  UserContext, 
  PromptEngine,
  PROMPT_TEMPLATES 
} from '@/lib/promptEngine';

export interface AIAnalysisHistory {
  id: string;
  symbol: string;
  analysis_type: string;
  prompt: string;
  response: string;
  timestamp: string;
  user_id: string;
}

export const useEnhancedAI = () => {
  const [analysisHistory, setAnalysisHistory] = useState<AIAnalysisHistory[]>([]);
  const [userContext, setUserContext] = useState<UserContext>({
    userId: '',
    experience: 'intermediate',
    riskTolerance: 'medium',
    tradingStyle: 'swing',
    recentAnalyses: [],
    preferences: {
      detailLevel: 'detailed',
      focusAreas: ['technical_analysis', 'risk_management']
    }
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Load user context and analysis history
  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get user profile for context
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Get recent analyses
        const { data: recentAnalyses } = await supabase
          .from('ai_usage_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(10);

        setUserContext(prev => ({
          ...prev,
          userId: user.id,
          recentAnalyses: recentAnalyses?.map(a => a.analysis_type) || []
        }));

        setAnalysisHistory(recentAnalyses || []);
      } catch (error) {
        console.error('Error loading user context:', error);
      }
    };

    loadUserContext();
  }, []);

  const generateEnhancedPrompt = (
    templateId: string,
    marketContext: MarketContext,
    customVariables?: Record<string, any>
  ): string => {
    const template = PROMPT_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return PromptEngine.buildPrompt(template, marketContext, userContext, customVariables);
  };

  const analyzeWithContext = async (
    imageData: string,
    marketContext: MarketContext,
    templateId?: string,
    customPrompt?: string
  ) => {
    setLoading(true);
    
    try {
      let prompt: string;
      
      if (customPrompt) {
        prompt = customPrompt;
      } else {
        // Select optimal template if none specified
        const template = templateId 
          ? PROMPT_TEMPLATES.find(t => t.id === templateId)
          : PromptEngine.selectOptimalTemplate(marketContext, userContext);
        
        if (!template) {
          throw new Error('No suitable template found');
        }

        prompt = PromptEngine.buildPrompt(template, marketContext, userContext);
      }

      // Enhanced metadata for better analysis
      const enhancedMetadata = {
        userExperience: userContext.experience,
        riskTolerance: userContext.riskTolerance,
        tradingStyle: userContext.tradingStyle,
        recentAnalysisCount: analysisHistory.length,
        marketVolatility: marketContext.volatility,
        analysisTimestamp: new Date().toISOString(),
        templateUsed: templateId || 'auto_selected'
      };

      const { data, error } = await supabase.functions.invoke('enhanced-ai-analyzer', {
        body: {
          imageData,
          prompt,
          marketContext,
          userContext,
          metadata: enhancedMetadata
        }
      });

      if (error) throw error;

      // Update analysis history
      if (data.success) {
        const newAnalysis: AIAnalysisHistory = {
          id: Date.now().toString(),
          symbol: marketContext.symbol,
          analysis_type: templateId || 'enhanced_analysis',
          prompt: prompt.substring(0, 500),
          response: JSON.stringify(data.analysis),
          timestamp: new Date().toISOString(),
          user_id: userContext.userId
        };
        
        setAnalysisHistory(prev => [newAnalysis, ...prev.slice(0, 9)]);
        
        // Update user context with recent analysis
        setUserContext(prev => ({
          ...prev,
          recentAnalyses: [templateId || 'enhanced_analysis', ...prev.recentAnalyses.slice(0, 4)]
        }));
      }

      return data;
    } catch (error) {
      console.error('Enhanced AI analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getContextualInsights = (symbol: string): string[] => {
    const symbolAnalyses = analysisHistory.filter(a => a.symbol === symbol);
    const insights: string[] = [];

    if (symbolAnalyses.length > 0) {
      insights.push(`You've analyzed ${symbol} ${symbolAnalyses.length} times recently`);
      
      const lastAnalysis = symbolAnalyses[0];
      if (lastAnalysis) {
        const timeDiff = Date.now() - new Date(lastAnalysis.timestamp).getTime();
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        
        if (hoursDiff < 24) {
          insights.push(`Last analysis was ${hoursDiff} hours ago`);
        }
      }
    }

    // Market context insights
    const recentTypes = userContext.recentAnalyses.slice(0, 3);
    if (recentTypes.length > 0) {
      insights.push(`Recent focus: ${recentTypes.join(', ')}`);
    }

    return insights;
  };

  const updateUserPreferences = (preferences: Partial<UserContext['preferences']>) => {
    setUserContext(prev => ({
      ...prev,
      preferences: { ...prev.preferences, ...preferences }
    }));
  };

  return {
    analysisHistory,
    userContext,
    loading,
    generateEnhancedPrompt,
    analyzeWithContext,
    getContextualInsights,
    updateUserPreferences,
    availableTemplates: PROMPT_TEMPLATES
  };
};