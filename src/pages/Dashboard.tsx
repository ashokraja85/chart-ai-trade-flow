
import { useState } from "react";
import { MarketOverview } from "@/components/MarketOverview";
import { PortfolioView } from "@/components/PortfolioView";
import { StockSearch } from "@/components/StockSearch";
import { EnhancedOptionChain } from "@/components/EnhancedOptionChain";
import { EnhancedStockChart } from "@/components/EnhancedStockChart";
import { AIAnalyzer } from "@/components/AIAnalyzer";
import { ZerodhaAuthButton } from "@/components/ZerodhaAuthButton";
import { EnhancedPortfolioDashboard } from "@/components/EnhancedPortfolioDashboard";
import { OrderPlacement } from "@/components/OrderPlacement";
import { PositionsHoldings } from "@/components/PositionsHoldings";
import { OrderBook } from "@/components/OrderBook";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Target, ShoppingCart } from "lucide-react";
import { useMarketData } from "@/hooks/useMarketData";
import { useZerodhaAuth } from "@/hooks/useZerodhaAuth";

const Dashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY");
  const { accessToken } = useZerodhaAuth();
  
  // Get current price for order placement
  const { data: quoteData } = useMarketData({
    symbol: selectedSymbol,
    dataType: 'quote',
    accessToken,
    refreshInterval: 5000
  });

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Trading Dashboard</h1>
          <p className="text-slate-400">Live market data powered by Zerodha</p>
        </div>
      </div>

      {/* Market Overview */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Market Overview
        </h2>
        <MarketOverview />
      </div>

      {/* Main Trading Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Zerodha Auth and Portfolio */}
        <div className="space-y-6">
          {/* Zerodha Authentication */}
          <ZerodhaAuthButton />

          {/* Stock Search */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Stock Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StockSearch 
                onStockSelect={setSelectedSymbol}
                selectedSymbol={selectedSymbol}
              />
            </CardContent>
          </Card>

          {/* Portfolio */}
          <PortfolioView />
        </div>

        {/* Right Column - Charts and Trading */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-slate-800">
              <TabsTrigger value="chart" className="data-[state=active]:bg-slate-700">
                Chart
              </TabsTrigger>
              <TabsTrigger value="options" className="data-[state=active]:bg-slate-700">
                Options
              </TabsTrigger>
              <TabsTrigger value="trade" className="data-[state=active]:bg-slate-700">
                Trade
              </TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-slate-700">
                Orders
              </TabsTrigger>
              <TabsTrigger value="portfolio" className="data-[state=active]:bg-slate-700">
                Portfolio
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <EnhancedStockChart symbol={selectedSymbol} />
                </div>
                <div>
                  <AIAnalyzer symbol={selectedSymbol} />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="options" className="space-y-4">
              <EnhancedOptionChain symbol={selectedSymbol} />
            </TabsContent>
            
            <TabsContent value="trade" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <OrderPlacement 
                  symbol={selectedSymbol} 
                  lastPrice={quoteData?.last_price || 0}
                />
                <PositionsHoldings />
              </div>
            </TabsContent>
            
            <TabsContent value="orders" className="space-y-4">
              <OrderBook />
            </TabsContent>
            
            <TabsContent value="portfolio" className="space-y-4">
              <EnhancedPortfolioDashboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Trading Summary - Real-time Portfolio Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Trading Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">Current Price</h3>
              <p className="text-2xl font-bold text-blue-400">
                ₹{quoteData?.last_price?.toFixed(2) || '0.00'}
              </p>
              <span className="text-xs text-slate-400">{selectedSymbol}</span>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">Day Change</h3>
              <p className={`text-2xl font-bold ${
                (quoteData?.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {quoteData?.change >= 0 ? '+' : ''}₹{quoteData?.change?.toFixed(2) || '0.00'}
              </p>
              <span className="text-xs text-slate-400">
                ({quoteData?.change_percent >= 0 ? '+' : ''}{quoteData?.change_percent?.toFixed(2) || '0.00'}%)
              </span>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">Volume</h3>
              <p className="text-2xl font-bold text-yellow-400">
                {quoteData?.volume ? (quoteData.volume / 1000).toFixed(0) + 'K' : '0'}
              </p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">Day Range</h3>
              <div className="text-sm text-slate-300">
                <p>L: ₹{quoteData?.ohlc?.low?.toFixed(2) || '0.00'}</p>
                <p>H: ₹{quoteData?.ohlc?.high?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
