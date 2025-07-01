
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, TrendingDown, Camera, BarChart3 } from "lucide-react";
import { MarketOverview } from "@/components/MarketOverview";
import { OptionChain } from "@/components/OptionChain";
import { StockChart } from "@/components/StockChart";
import { AIAnalyzer } from "@/components/AIAnalyzer";
import { PortfolioView } from "@/components/PortfolioView";

const Dashboard = () => {
  const [selectedSymbol, setSelectedSymbol] = useState("NIFTY");
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Trading Dashboard</h1>
            <p className="text-slate-400">Real-time market data and AI-powered analysis</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search stocks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white border-green-600">
              <Camera className="h-4 w-4 mr-2" />
              AI Analyze
            </Button>
          </div>
        </div>

        {/* Market Overview */}
        <MarketOverview />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column - Charts and Option Chain */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="chart" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-800">
                <TabsTrigger value="chart" className="text-white data-[state=active]:bg-slate-700">
                  Stock Chart
                </TabsTrigger>
                <TabsTrigger value="options" className="text-white data-[state=active]:bg-slate-700">
                  Option Chain
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chart" className="mt-4">
                <StockChart symbol={selectedSymbol} />
              </TabsContent>
              <TabsContent value="options" className="mt-4">
                <OptionChain symbol={selectedSymbol} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - AI Analyzer and Portfolio */}
          <div className="space-y-6">
            <AIAnalyzer />
            <PortfolioView />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
