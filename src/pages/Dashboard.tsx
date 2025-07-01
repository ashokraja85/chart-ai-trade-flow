
import { useState } from "react";
import { MarketOverview } from "@/components/MarketOverview";
import { PortfolioView } from "@/components/PortfolioView";
import { StockSearch } from "@/components/StockSearch";
import { EnhancedOptionChain } from "@/components/EnhancedOptionChain";
import { EnhancedStockChart } from "@/components/EnhancedStockChart";
import { ZerodhaAuthButton } from "@/components/ZerodhaAuthButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3, Target } from "lucide-react";

const Dashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY");

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

        {/* Right Column - Charts and Options */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="chart" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-800">
              <TabsTrigger value="chart" className="data-[state=active]:bg-slate-700">
                Price Chart
              </TabsTrigger>
              <TabsTrigger value="options" className="data-[state=active]:bg-slate-700">
                Option Chain
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="chart" className="space-y-4">
              <EnhancedStockChart symbol={selectedSymbol} />
            </TabsContent>
            
            <TabsContent value="options" className="space-y-4">
              <EnhancedOptionChain symbol={selectedSymbol} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">Active Positions</h3>
              <p className="text-2xl font-bold text-green-400">3</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">Watchlist Items</h3>
              <p className="text-2xl font-bold text-blue-400">12</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">Alerts Set</h3>
              <p className="text-2xl font-bold text-yellow-400">5</p>
            </div>
            <div className="bg-slate-700 p-4 rounded-lg text-center">
              <h3 className="font-medium text-white">P&L Today</h3>
              <p className="text-2xl font-bold text-green-400">+₹2,450</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
