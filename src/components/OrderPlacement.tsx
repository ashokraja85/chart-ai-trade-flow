import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, ShoppingCart, AlertCircle } from "lucide-react";
import { useZerodhaTrading, OrderRequest } from "@/hooks/useZerodhaTrading";
import { useToast } from "@/hooks/use-toast";

interface OrderPlacementProps {
  symbol?: string;
  lastPrice?: number;
}

export const OrderPlacement = ({ symbol = "RELIANCE", lastPrice = 0 }: OrderPlacementProps) => {
  const { placeOrder, loading, error } = useZerodhaTrading();
  const { toast } = useToast();
  
  const [orderData, setOrderData] = useState<OrderRequest>({
    tradingsymbol: symbol,
    exchange: "NSE",
    transaction_type: "BUY",
    order_type: "LIMIT",
    quantity: 1,
    price: lastPrice,
    product: "MIS",
    variety: "regular"
  });

  const [isBuyOrder, setIsBuyOrder] = useState(true);

  const handlePlaceOrder = async () => {
    try {
      const finalOrderData: OrderRequest = {
        ...orderData,
        transaction_type: isBuyOrder ? "BUY" : "SELL",
        tradingsymbol: orderData.tradingsymbol.toUpperCase()
      };

      console.log('Placing order:', finalOrderData);
      
      const result = await placeOrder(finalOrderData);
      
      toast({
        title: "Order Placed Successfully",
        description: `Order ID: ${result.order_id}`,
        duration: 5000,
      });

      console.log('Order placed successfully:', result);
    } catch (err) {
      console.error('Order placement failed:', err);
      toast({
        title: "Order Failed",
        description: err instanceof Error ? err.message : "Failed to place order",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const updateOrderData = (field: keyof OrderRequest, value: any) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
  };

  const calculateOrderValue = () => {
    if (orderData.order_type === "MARKET") {
      return (lastPrice * orderData.quantity).toFixed(2);
    }
    return ((orderData.price || 0) * orderData.quantity).toFixed(2);
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Place Order
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {/* Buy/Sell Toggle */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              checked={isBuyOrder}
              onCheckedChange={setIsBuyOrder}
              className="data-[state=checked]:bg-green-600"
            />
            <Label className="text-white">
              {isBuyOrder ? "BUY" : "SELL"}
            </Label>
            <Badge className={isBuyOrder ? "bg-green-600" : "bg-red-600"}>
              {isBuyOrder ? "BUY" : "SELL"}
            </Badge>
          </div>
        </div>

        {/* Symbol Input */}
        <div className="space-y-2">
          <Label htmlFor="symbol" className="text-slate-300">Symbol</Label>
          <Input
            id="symbol"
            value={orderData.tradingsymbol}
            onChange={(e) => updateOrderData('tradingsymbol', e.target.value.toUpperCase())}
            className="bg-slate-700 border-slate-600 text-white"
            placeholder="Enter symbol (e.g., RELIANCE)"
          />
        </div>

        {/* Order Type */}
        <div className="space-y-2">
          <Label className="text-slate-300">Order Type</Label>
          <Select
            value={orderData.order_type}
            onValueChange={(value: "MARKET" | "LIMIT") => updateOrderData('order_type', value)}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="MARKET">Market</SelectItem>
              <SelectItem value="LIMIT">Limit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quantity */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-slate-300">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            value={orderData.quantity}
            onChange={(e) => updateOrderData('quantity', parseInt(e.target.value) || 1)}
            className="bg-slate-700 border-slate-600 text-white"
            min="1"
          />
        </div>

        {/* Price (only for LIMIT orders) */}
        {orderData.order_type === "LIMIT" && (
          <div className="space-y-2">
            <Label htmlFor="price" className="text-slate-300">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.05"
              value={orderData.price || ''}
              onChange={(e) => updateOrderData('price', parseFloat(e.target.value) || 0)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder={lastPrice ? lastPrice.toString() : "Enter price"}
            />
          </div>
        )}

        {/* Product Type */}
        <div className="space-y-2">
          <Label className="text-slate-300">Product</Label>
          <Select
            value={orderData.product}
            onValueChange={(value: "MIS" | "NRML" | "CNC") => updateOrderData('product', value)}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="MIS">MIS (Intraday)</SelectItem>
              <SelectItem value="NRML">NRML (Normal)</SelectItem>
              <SelectItem value="CNC">CNC (Delivery)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exchange */}
        <div className="space-y-2">
          <Label className="text-slate-300">Exchange</Label>
          <Select
            value={orderData.exchange}
            onValueChange={(value) => updateOrderData('exchange', value)}
          >
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="NSE">NSE</SelectItem>
              <SelectItem value="BSE">BSE</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Order Value */}
        <div className="p-3 bg-slate-700 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Order Value:</span>
            <span className="text-white font-medium">₹{calculateOrderValue()}</span>
          </div>
        </div>

        {/* Place Order Button */}
        <Button
          onClick={handlePlaceOrder}
          disabled={loading || !orderData.tradingsymbol || orderData.quantity < 1}
          className={`w-full ${
            isBuyOrder 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          {loading ? "Placing Order..." : `${isBuyOrder ? 'BUY' : 'SELL'} ${orderData.quantity} shares`}
        </Button>

        <div className="text-xs text-slate-400 space-y-1">
          <p>• Market orders execute immediately at current market price</p>
          <p>• Limit orders execute only at specified price or better</p>
          <p>• MIS positions are auto-squared off before market close</p>
        </div>
      </CardContent>
    </Card>
  );
};