import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, AlertCircle, X, Edit3 } from "lucide-react";
import { useZerodhaTrading, Order } from "@/hooks/useZerodhaTrading";
import { useToast } from "@/hooks/use-toast";

export const OrderBook = () => {
  const { getOrders, cancelOrder, loading, error } = useZerodhaTrading();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cancellingOrder, setCancellingOrder] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      console.log('Fetching order book...');
      
      const ordersData = await getOrders();
      setOrders(ordersData || []);
      setLastUpdated(new Date());
      
      console.log('Order book updated successfully, orders count:', ordersData?.length || 0);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      toast({
        title: "Orders Fetch Failed",
        description: err instanceof Error ? err.message : "Failed to fetch orders",
        variant: "destructive",
        duration: 5000,
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      setCancellingOrder(orderId);
      console.log('Cancelling order:', orderId);
      
      await cancelOrder(orderId);
      
      toast({
        title: "Order Cancelled",
        description: `Order ${orderId} has been cancelled`,
        duration: 3000,
      });
      
      // Refresh orders after cancellation
      await fetchOrders();
    } catch (err) {
      console.error('Failed to cancel order:', err);
      toast({
        title: "Cancel Failed",
        description: err instanceof Error ? err.message : "Failed to cancel order",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setCancellingOrder(null);
    }
  };

  useEffect(() => {
    fetchOrders();
    
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'COMPLETE':
        return 'bg-green-600';
      case 'OPEN':
      case 'TRIGGER PENDING':
        return 'bg-blue-600';
      case 'CANCELLED':
        return 'bg-gray-600';
      case 'REJECTED':
        return 'bg-red-600';
      default:
        return 'bg-yellow-600';
    }
  };

  const getTransactionColor = (type: string) => {
    return type === 'BUY' ? 'text-green-400' : 'text-red-400';
  };

  const canCancelOrder = (status: string) => {
    return ['OPEN', 'TRIGGER PENDING'].includes(status.toUpperCase());
  };

  const pendingOrders = orders.filter(order => canCancelOrder(order.status));
  const completedOrders = orders.filter(order => !canCancelOrder(order.status));

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Order Book
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-slate-400">
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={fetchOrders}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-slate-600"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
        
        {/* Orders Summary */}
        <div className="flex items-center gap-4 pt-2">
          <Badge variant="outline" className="border-blue-600 text-blue-400">
            Pending: {pendingOrders.length}
          </Badge>
          <Badge variant="outline" className="border-green-600 text-green-400">
            Completed: {completedOrders.filter(o => o.status.toUpperCase() === 'COMPLETE').length}
          </Badge>
          <Badge variant="outline" className="border-gray-600 text-gray-400">
            Total: {orders.length}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg mb-4">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Edit3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-700">
                  <TableHead className="text-slate-300">Time</TableHead>
                  <TableHead className="text-slate-300">Symbol</TableHead>
                  <TableHead className="text-slate-300">Type</TableHead>
                  <TableHead className="text-slate-300">Order</TableHead>
                  <TableHead className="text-slate-300">Qty</TableHead>
                  <TableHead className="text-slate-300">Price</TableHead>
                  <TableHead className="text-slate-300">Status</TableHead>
                  <TableHead className="text-slate-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders
                  .sort((a, b) => new Date(b.order_timestamp).getTime() - new Date(a.order_timestamp).getTime())
                  .map((order) => (
                  <TableRow key={order.order_id} className="border-slate-700">
                    <TableCell className="text-slate-300 text-xs">
                      {new Date(order.order_timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-white font-medium">
                      {order.tradingsymbol}
                    </TableCell>
                    <TableCell>
                      <span className={getTransactionColor(order.transaction_type)}>
                        {order.transaction_type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-slate-600 text-slate-300">
                        {order.order_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {order.quantity}
                      {order.filled_quantity > 0 && (
                        <span className="text-green-400 text-xs block">
                          Filled: {order.filled_quantity}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      {order.order_type === 'MARKET' ? 'Market' : formatCurrency(order.price)}
                      {order.average_price > 0 && (
                        <span className="text-blue-400 text-xs block">
                          Avg: {formatCurrency(order.average_price)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                      {order.status_message && order.status_message !== order.status && (
                        <span className="text-xs text-slate-400 block mt-1">
                          {order.status_message}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {canCancelOrder(order.status) && (
                        <Button
                          onClick={() => handleCancelOrder(order.order_id)}
                          disabled={cancellingOrder === order.order_id}
                          variant="outline"
                          size="sm"
                          className="border-red-600 text-red-400 hover:bg-red-900/20"
                        >
                          <X className="h-3 w-3 mr-1" />
                          {cancellingOrder === order.order_id ? 'Cancelling...' : 'Cancel'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};