import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Briefcase, RefreshCw, AlertCircle } from "lucide-react";
import { useZerodhaTrading, Position, Holding } from "@/hooks/useZerodhaTrading";
import { useToast } from "@/hooks/use-toast";

export const PositionsHoldings = () => {
  const { getPositions, getHoldings, loading, error } = useZerodhaTrading();
  const { toast } = useToast();
  
  const [positions, setPositions] = useState<{ net: Position[], day: Position[] }>({ net: [], day: [] });
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      console.log('Fetching positions and holdings...');
      
      const [positionsData, holdingsData] = await Promise.all([
        getPositions(),
        getHoldings()
      ]);
      
      setPositions(positionsData || { net: [], day: [] });
      setHoldings(holdingsData || []);
      setLastUpdated(new Date());
      
      console.log('Positions and holdings updated successfully');
    } catch (err) {
      console.error('Failed to fetch portfolio data:', err);
      toast({
        title: "Portfolio Fetch Failed",
        description: err instanceof Error ? err.message : "Failed to fetch portfolio data",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
  };

  const getTotalPnL = () => {
    const positionsPnL = positions.net.reduce((sum, pos) => sum + (pos.unrealised || 0), 0);
    const holdingsPnL = holdings.reduce((sum, holding) => sum + (holding.pnl || 0), 0);
    return positionsPnL + holdingsPnL;
  };

  const PositionsTable = ({ positionsData, title }: { positionsData: Position[], title: string }) => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">{title}</h3>
      {positionsData.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No {title.toLowerCase()} found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Symbol</TableHead>
                <TableHead className="text-slate-300">Qty</TableHead>
                <TableHead className="text-slate-300">Avg Price</TableHead>
                <TableHead className="text-slate-300">LTP</TableHead>
                <TableHead className="text-slate-300">P&L</TableHead>
                <TableHead className="text-slate-300">Product</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {positionsData.map((position, index) => (
                <TableRow key={index} className="border-slate-700">
                  <TableCell className="text-white font-medium">
                    {position.tradingsymbol}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {position.quantity}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatCurrency(position.average_price)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatCurrency(position.last_price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {position.unrealised >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={position.unrealised >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(position.unrealised)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-slate-600 text-slate-300">
                      {position.product}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  const HoldingsTable = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Holdings</h3>
      {holdings.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No holdings found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700">
                <TableHead className="text-slate-300">Symbol</TableHead>
                <TableHead className="text-slate-300">Qty</TableHead>
                <TableHead className="text-slate-300">Avg Price</TableHead>
                <TableHead className="text-slate-300">LTP</TableHead>
                <TableHead className="text-slate-300">P&L</TableHead>
                <TableHead className="text-slate-300">Day Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding, index) => (
                <TableRow key={index} className="border-slate-700">
                  <TableCell className="text-white font-medium">
                    {holding.tradingsymbol}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {holding.quantity}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatCurrency(holding.average_price)}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {formatCurrency(holding.last_price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {holding.pnl >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={holding.pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {formatCurrency(holding.pnl)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={holding.day_change >= 0 ? 'text-green-400' : 'text-red-400'}>
                      {formatPercent(holding.day_change_percentage)}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Portfolio
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={fetchData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-slate-600"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Total P&L Summary */}
        <div className="flex items-center gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Total P&L:</span>
            <Badge className={getTotalPnL() >= 0 ? 'bg-green-600' : 'bg-red-600'}>
              {getTotalPnL() >= 0 ? '+' : ''}{formatCurrency(getTotalPnL())}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <Tabs defaultValue="positions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-700">
            <TabsTrigger value="positions" className="data-[state=active]:bg-slate-600">
              Positions
            </TabsTrigger>
            <TabsTrigger value="holdings" className="data-[state=active]:bg-slate-600">
              Holdings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="positions" className="space-y-6">
            <PositionsTable positionsData={positions.net} title="Net Positions" />
            {positions.day.length > 0 && (
              <PositionsTable positionsData={positions.day} title="Day Positions" />
            )}
          </TabsContent>
          
          <TabsContent value="holdings">
            <HoldingsTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};