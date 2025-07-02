import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Download, RefreshCw, Briefcase, Filter } from "lucide-react";
import { useEnhancedPortfolio } from "@/hooks/useEnhancedPortfolio";

export const EnhancedPortfolioDashboard = () => {
  const { positions, trades, summary, loading, refreshPortfolio, exportToCSV } = useEnhancedPortfolio();
  const [groupBy, setGroupBy] = useState<'symbol' | 'instrument_type' | 'expiry'>('symbol');
  const [filterType, setFilterType] = useState<'all' | 'EQUITY' | 'OPTION' | 'FUTURE'>('all');

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

  const getGroupedPositions = () => {
    let filtered = positions;
    if (filterType !== 'all') {
      filtered = positions.filter(pos => pos.instrument_type === filterType);
    }

    const grouped = filtered.reduce((acc, position) => {
      let key = '';
      switch (groupBy) {
        case 'symbol':
          key = position.symbol;
          break;
        case 'instrument_type':
          key = position.instrument_type;
          break;
        case 'expiry':
          key = position.expiry_date || 'No Expiry';
          break;
      }

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(position);
      return acc;
    }, {} as Record<string, typeof positions>);

    return grouped;
  };

  const handleExportTrades = () => {
    const filename = `trade_history_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCSV(trades, filename);
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-400' : 'text-red-400';
  };

  const getPnLIcon = (pnl: number) => {
    return pnl >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={refreshPortfolio}
                disabled={loading}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={handleExportTrades}
                variant="outline"
                size="sm"
                className="border-slate-600"
              >
                <Download className="h-4 w-4 mr-1" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300">Total Investment</h3>
                <p className="text-xl font-bold text-white">{formatCurrency(summary.total_investment)}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300">Current Value</h3>
                <p className="text-xl font-bold text-white">{formatCurrency(summary.current_value)}</p>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300">Total P&L</h3>
                <div className="flex items-center gap-2">
                  {getPnLIcon(summary.total_pnl)}
                  <div>
                    <p className={`text-xl font-bold ${getPnLColor(summary.total_pnl)}`}>
                      {formatCurrency(summary.total_pnl)}
                    </p>
                    <p className={`text-sm ${getPnLColor(summary.total_pnl)}`}>
                      {formatPercent(summary.total_pnl_percent)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-slate-300">Day P&L</h3>
                <div className="flex items-center gap-2">
                  {getPnLIcon(summary.day_pnl)}
                  <div>
                    <p className={`text-xl font-bold ${getPnLColor(summary.day_pnl)}`}>
                      {formatCurrency(summary.day_pnl)}
                    </p>
                    <p className={`text-sm ${getPnLColor(summary.day_pnl)}`}>
                      {formatPercent(summary.day_pnl_percent)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Portfolio Interface */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">Portfolio Positions</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="all">All Instruments</SelectItem>
                  <SelectItem value="EQUITY">Equity</SelectItem>
                  <SelectItem value="OPTION">Options</SelectItem>
                  <SelectItem value="FUTURE">Futures</SelectItem>
                </SelectContent>
              </Select>
              <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                <SelectTrigger className="w-40 bg-slate-700 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="symbol">By Symbol</SelectItem>
                  <SelectItem value="instrument_type">By Instrument</SelectItem>
                  <SelectItem value="expiry">By Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="positions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-slate-700">
              <TabsTrigger value="positions" className="data-[state=active]:bg-slate-600">
                Live Positions
              </TabsTrigger>
              <TabsTrigger value="trades" className="data-[state=active]:bg-slate-600">
                Trade History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="positions" className="space-y-4">
              {Object.entries(getGroupedPositions()).map(([groupKey, groupPositions]) => (
                <div key={groupKey} className="space-y-2">
                  <h3 className="text-lg font-medium text-white border-b border-slate-600 pb-2">
                    {groupKey}
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700">
                          <TableHead className="text-slate-300">Symbol</TableHead>
                          <TableHead className="text-slate-300">Type</TableHead>
                          <TableHead className="text-slate-300">Qty</TableHead>
                          <TableHead className="text-slate-300">Avg Price</TableHead>
                          <TableHead className="text-slate-300">Current Price</TableHead>
                          <TableHead className="text-slate-300">Investment</TableHead>
                          <TableHead className="text-slate-300">Current Value</TableHead>
                          <TableHead className="text-slate-300">P&L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {groupPositions.map((position, index) => (
                          <TableRow key={index} className="border-slate-700">
                            <TableCell className="text-white font-medium">
                              <div>
                                <div>{position.symbol}</div>
                                {position.expiry_date && (
                                  <div className="text-xs text-slate-400">
                                    {position.strike_price} {position.option_type} | {position.expiry_date}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-slate-600 text-slate-300">
                                {position.instrument_type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-300">{position.total_quantity}</TableCell>
                            <TableCell className="text-slate-300">{formatCurrency(position.avg_price)}</TableCell>
                            <TableCell className="text-slate-300">{formatCurrency(position.current_price)}</TableCell>
                            <TableCell className="text-slate-300">{formatCurrency(position.investment_value)}</TableCell>
                            <TableCell className="text-slate-300">{formatCurrency(position.current_value)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getPnLIcon(position.total_pnl)}
                                <div>
                                  <div className={`font-medium ${getPnLColor(position.total_pnl)}`}>
                                    {formatCurrency(position.total_pnl)}
                                  </div>
                                  <div className={`text-xs ${getPnLColor(position.total_pnl)}`}>
                                    {formatPercent((position.total_pnl / position.investment_value) * 100)}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="trades" className="space-y-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">Date</TableHead>
                      <TableHead className="text-slate-300">Symbol</TableHead>
                      <TableHead className="text-slate-300">Type</TableHead>
                      <TableHead className="text-slate-300">Side</TableHead>
                      <TableHead className="text-slate-300">Qty</TableHead>
                      <TableHead className="text-slate-300">Price</TableHead>
                      <TableHead className="text-slate-300">Amount</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trades.slice(0, 100).map((trade) => (
                      <TableRow key={trade.id} className="border-slate-700">
                        <TableCell className="text-slate-300 text-xs">
                          {new Date(trade.executed_at).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          <div>
                            <div>{trade.symbol}</div>
                            {trade.expiry_date && (
                              <div className="text-xs text-slate-400">
                                {trade.strike_price} {trade.option_type} | {trade.expiry_date}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {trade.instrument_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className={trade.transaction_type === 'BUY' ? 'text-green-400' : 'text-red-400'}>
                            {trade.transaction_type}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-300">{trade.quantity}</TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(trade.price)}</TableCell>
                        <TableCell className="text-slate-300">{formatCurrency(trade.net_amount)}</TableCell>
                        <TableCell>
                          <Badge 
                            className={
                              trade.status === 'EXECUTED' ? 'bg-green-600' :
                              trade.status === 'CANCELLED' ? 'bg-red-600' : 'bg-yellow-600'
                            }
                          >
                            {trade.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};