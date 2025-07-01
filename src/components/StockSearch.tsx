
import { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  sector: string;
}

interface StockSearchProps {
  onStockSelect: (symbol: string) => void;
  selectedSymbol?: string;
}

export const StockSearch = ({ onStockSelect, selectedSymbol }: StockSearchProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const searchStocks = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('nse_stocks')
          .select('id, symbol, company_name, sector')
          .or(`symbol.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%`)
          .eq('is_active', true)
          .limit(10);

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching stocks:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleStockSelect = (stock: Stock) => {
    setSearchTerm(stock.symbol);
    setShowSuggestions(false);
    onStockSelect(stock.symbol);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <Input
          type="text"
          placeholder="Search stocks (e.g., RELIANCE, TCS)..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-slate-400"
        />
        {loading && (
          <div className="absolute right-3 top-3">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></div>
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-slate-800 border-slate-700">
          <CardContent className="p-0">
            {suggestions.map((stock) => (
              <Button
                key={stock.id}
                variant="ghost"
                className="w-full justify-start px-4 py-3 text-left hover:bg-slate-700"
                onClick={() => handleStockSelect(stock)}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <div>
                    <div className="font-medium text-white">{stock.symbol}</div>
                    <div className="text-sm text-slate-400">{stock.company_name}</div>
                    <div className="text-xs text-slate-500">{stock.sector}</div>
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}

      {selectedSymbol && (
        <div className="mt-2">
          <div className="text-sm text-slate-400">Selected: 
            <span className="ml-1 font-medium text-white">{selectedSymbol}</span>
          </div>
        </div>
      )}
    </div>
  );
};
