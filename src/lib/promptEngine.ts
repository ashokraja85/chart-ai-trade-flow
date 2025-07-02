export interface PromptTemplate {
  id: string;
  name: string;
  category: 'chart_analysis' | 'market_sentiment' | 'risk_assessment' | 'pattern_recognition' | 'custom';
  description: string;
  template: string;
  variables: string[];
  instrumentTypes: ('EQUITY' | 'OPTION' | 'FUTURE')[];
  marketConditions?: ('bullish' | 'bearish' | 'neutral' | 'volatile')[];
}

export interface MarketContext {
  symbol: string;
  instrumentType: 'EQUITY' | 'OPTION' | 'FUTURE';
  currentPrice: number;
  marketCondition: 'bullish' | 'bearish' | 'neutral' | 'volatile';
  volatility: number;
  volume: number;
  timeframe: string;
  technicalIndicators?: {
    rsi?: number;
    macd?: number;
    sma_50?: number;
    sma_200?: number;
  };
}

export interface UserContext {
  userId: string;
  experience: 'beginner' | 'intermediate' | 'advanced';
  riskTolerance: 'low' | 'medium' | 'high';
  tradingStyle: 'scalping' | 'swing' | 'position' | 'long_term';
  recentAnalyses: string[];
  preferences: {
    detailLevel: 'brief' | 'detailed' | 'comprehensive';
    focusAreas: string[];
  };
}

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'comprehensive_chart_analysis',
    name: 'Comprehensive Chart Analysis',
    category: 'chart_analysis',
    description: 'Deep technical analysis with multiple timeframes and indicators',
    template: `Analyze this {{instrumentType}} chart for {{symbol}} with comprehensive technical analysis.

Current Market Context:
- Symbol: {{symbol}} ({{instrumentType}})
- Current Price: ₹{{currentPrice}}
- Market Condition: {{marketCondition}}
- Volatility: {{volatility}}%
- Volume: {{volume}}
- Timeframe: {{timeframe}}
{{#technicalIndicators}}
- RSI: {{rsi}}
- MACD: {{macd}}
- SMA 50: {{sma_50}}
- SMA 200: {{sma_200}}
{{/technicalIndicators}}

User Profile:
- Experience Level: {{experience}}
- Risk Tolerance: {{riskTolerance}}
- Trading Style: {{tradingStyle}}
- Detail Preference: {{detailLevel}}

Please provide a {{detailLevel}} analysis focusing on:
1. **Primary Trend Analysis**: Multi-timeframe trend confirmation
2. **Technical Pattern Recognition**: Chart patterns with probability assessments
3. **Key Levels**: Dynamic support/resistance with confluence factors
4. **Momentum Analysis**: RSI, MACD, and momentum oscillators
5. **Volume Profile**: Volume analysis and accumulation/distribution
6. **Risk Assessment**: Tailored to {{riskTolerance}} risk tolerance
7. **Entry/Exit Strategy**: Suited for {{tradingStyle}} trading style
8. **Market Structure**: Higher timeframe context and market bias

Adjust the complexity and terminology for a {{experience}} trader.`,
    variables: ['symbol', 'instrumentType', 'currentPrice', 'marketCondition', 'volatility', 'volume', 'timeframe', 'experience', 'riskTolerance', 'tradingStyle', 'detailLevel'],
    instrumentTypes: ['EQUITY', 'OPTION', 'FUTURE']
  },
  
  {
    id: 'options_strategy_analysis',
    name: 'Options Strategy Analysis',
    category: 'chart_analysis',
    description: 'Specialized analysis for options trading strategies',
    template: `Analyze this options chart for {{symbol}} and recommend optimal options strategies.

Options Context:
- Underlying: {{symbol}}
- Current Spot: ₹{{currentPrice}}
- Implied Volatility: {{volatility}}%
- Market Outlook: {{marketCondition}}
- Time to Expiry: Consider multiple expiries
- Greeks Analysis: Delta, Gamma, Theta, Vega impact

Focus Areas:
1. **Directional Strategies**: Based on trend analysis
2. **Volatility Strategies**: IV rank and volatility forecasting
3. **Time Decay Strategies**: Theta optimization
4. **Risk/Reward Analysis**: Maximum risk and profit potential
5. **Greeks Management**: How Greeks will change with price/time
6. **Strike Selection**: Optimal strike prices for strategies
7. **Entry/Exit Timing**: Best market conditions for entry

Recommend 2-3 strategies with:
- Strategy name and structure
- Market view required
- Maximum risk/reward
- Breakeven points
- Greeks profile
- Management guidelines`,
    variables: ['symbol', 'currentPrice', 'volatility', 'marketCondition'],
    instrumentTypes: ['OPTION']
  },

  {
    id: 'risk_management_focus',
    name: 'Risk Management Analysis',
    category: 'risk_assessment',
    description: 'Focus on risk assessment and position sizing',
    template: `Perform a risk-focused analysis for {{symbol}} trading setup.

Risk Assessment Parameters:
- Current Price: ₹{{currentPrice}}
- User Risk Tolerance: {{riskTolerance}}
- Trading Capital: Consider position sizing
- Market Volatility: {{volatility}}%
- Market Condition: {{marketCondition}}

Risk Analysis Focus:
1. **Position Sizing**: Optimal position size based on volatility
2. **Stop Loss Levels**: Multiple stop levels with reasoning
3. **Risk/Reward Ratios**: Minimum 1:2 ratio analysis
4. **Worst Case Scenarios**: Potential drawdown analysis
5. **Correlation Risk**: Sector/market correlation factors
6. **Liquidity Risk**: Volume and spread analysis
7. **Market Risk Events**: Upcoming events/announcements
8. **Portfolio Impact**: How this trade affects overall portfolio

Provide specific risk metrics:
- Maximum acceptable loss per trade
- Position size calculation
- Multiple stop loss scenarios
- Risk probability assessment`,
    variables: ['symbol', 'currentPrice', 'riskTolerance', 'volatility', 'marketCondition'],
    instrumentTypes: ['EQUITY', 'OPTION', 'FUTURE']
  },

  {
    id: 'pattern_recognition_specialist',
    name: 'Pattern Recognition Specialist',
    category: 'pattern_recognition',
    description: 'Expert pattern identification and probability analysis',
    template: `Perform advanced pattern recognition analysis for {{symbol}}.

Pattern Analysis Context:
- Symbol: {{symbol}}
- Timeframe: {{timeframe}}
- Current Price: ₹{{currentPrice}}
- Pattern History: {{#recentAnalyses}}Previous patterns: {{.}}{{/recentAnalyses}}

Advanced Pattern Recognition:
1. **Classical Patterns**: Head & shoulders, triangles, flags, pennants
2. **Candlestick Patterns**: Single and multi-candle patterns
3. **Volume Patterns**: Volume confirmation and divergence
4. **Harmonic Patterns**: Gartley, Butterfly, Bat patterns with Fibonacci
5. **Elliott Wave**: Wave count and projection
6. **Market Structure**: Higher highs/lows, trend changes
7. **Pattern Confluence**: Multiple pattern confirmations
8. **Historical Success Rate**: Pattern performance in current market

For each identified pattern:
- Pattern name and classification
- Completion probability
- Historical success rate
- Target projections with Fibonacci
- Invalidation levels
- Time frame for completion
- Volume confirmation required`,
    variables: ['symbol', 'timeframe', 'currentPrice', 'recentAnalyses'],
    instrumentTypes: ['EQUITY', 'OPTION', 'FUTURE']
  },

  {
    id: 'market_sentiment_analysis',
    name: 'Market Sentiment Analysis',
    category: 'market_sentiment',
    description: 'Comprehensive market sentiment and intermarket analysis',
    template: `Analyze market sentiment and intermarket relationships for {{symbol}}.

Sentiment Analysis Framework:
- Primary Asset: {{symbol}}
- Market Environment: {{marketCondition}}
- Volatility Index: {{volatility}}%
- Volume Profile: {{volume}}

Multi-dimensional Sentiment Analysis:
1. **Technical Sentiment**: Price action and momentum
2. **Volume Sentiment**: Accumulation vs distribution
3. **Volatility Sentiment**: Fear/greed indicators
4. **Intermarket Analysis**: Correlation with indices, commodities
5. **Sector Rotation**: Sector strength/weakness analysis
6. **Currency Impact**: INR strength effects on stocks
7. **Global Sentiment**: International market influence
8. **News Sentiment**: Fundamental backdrop consideration

Sentiment Indicators to Evaluate:
- Put/Call ratios
- VIX levels and trends
- Breadth indicators
- Momentum oscillators
- Volume flow analysis
- Sector rotation patterns

Provide sentiment score (1-100) with reasoning and implications for {{symbol}}.`,
    variables: ['symbol', 'marketCondition', 'volatility', 'volume'],
    instrumentTypes: ['EQUITY', 'OPTION', 'FUTURE']
  }
];

export class PromptEngine {
  static buildPrompt(
    template: PromptTemplate,
    marketContext: MarketContext,
    userContext: UserContext,
    customVariables?: Record<string, any>
  ): string {
    let prompt = template.template;
    
    // Replace market context variables
    const marketVars = {
      symbol: marketContext.symbol,
      instrumentType: marketContext.instrumentType,
      currentPrice: marketContext.currentPrice.toString(),
      marketCondition: marketContext.marketCondition,
      volatility: marketContext.volatility.toString(),
      volume: marketContext.volume.toString(),
      timeframe: marketContext.timeframe,
      ...marketContext.technicalIndicators
    };

    // Replace user context variables
    const userVars = {
      experience: userContext.experience,
      riskTolerance: userContext.riskTolerance,
      tradingStyle: userContext.tradingStyle,
      detailLevel: userContext.preferences.detailLevel,
      recentAnalyses: userContext.recentAnalyses
    };

    // Combine all variables
    const allVars = { ...marketVars, ...userVars, ...customVariables };

    // Replace variables in template
    Object.entries(allVars).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      prompt = prompt.replace(regex, String(value));
    });

    return prompt;
  }

  static getTemplatesByCategory(category: PromptTemplate['category']): PromptTemplate[] {
    return PROMPT_TEMPLATES.filter(template => template.category === category);
  }

  static getTemplatesByInstrument(instrumentType: 'EQUITY' | 'OPTION' | 'FUTURE'): PromptTemplate[] {
    return PROMPT_TEMPLATES.filter(template => 
      template.instrumentTypes.includes(instrumentType)
    );
  }

  static selectOptimalTemplate(
    marketContext: MarketContext,
    userContext: UserContext,
    analysisType?: string
  ): PromptTemplate {
    // Smart template selection based on context
    let filteredTemplates = PROMPT_TEMPLATES.filter(template =>
      template.instrumentTypes.includes(marketContext.instrumentType)
    );

    // If specific analysis type requested
    if (analysisType) {
      const typeFiltered = filteredTemplates.filter(t => 
        t.name.toLowerCase().includes(analysisType.toLowerCase()) ||
        t.category.includes(analysisType as any)
      );
      if (typeFiltered.length > 0) {
        filteredTemplates = typeFiltered;
      }
    }

    // Select based on user experience and market conditions
    if (userContext.experience === 'beginner') {
      // Prefer simpler templates
      const simpleTemplate = filteredTemplates.find(t => 
        t.description.toLowerCase().includes('comprehensive') === false
      );
      if (simpleTemplate) return simpleTemplate;
    }

    // For options, prefer options-specific templates
    if (marketContext.instrumentType === 'OPTION') {
      const optionsTemplate = filteredTemplates.find(t => 
        t.name.toLowerCase().includes('option')
      );
      if (optionsTemplate) return optionsTemplate;
    }

    // Default to comprehensive analysis
    return filteredTemplates.find(t => t.id === 'comprehensive_chart_analysis') || 
           filteredTemplates[0];
  }
}