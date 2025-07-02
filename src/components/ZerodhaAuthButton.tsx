
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, LogIn, LogOut, AlertCircle } from "lucide-react";
import { useZerodhaAuth } from "@/hooks/useZerodhaAuth";

export const ZerodhaAuthButton = () => {
  const { isAuthenticated, loading, error, initiateLogin, logout } = useZerodhaAuth();

  if (loading) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <div className="text-slate-400">Checking Zerodha authentication...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Zerodha Connection
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-slate-300">Status:</span>
          <Badge className={isAuthenticated ? "bg-green-600" : "bg-red-600"}>
            {isAuthenticated ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-900/20 border border-red-700 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <div className="text-xs text-slate-400">
          {isAuthenticated 
            ? "You're connected to Zerodha and receiving live market data."
            : "Connect to Zerodha to access live market data and trading features."
          }
        </div>

        {isAuthenticated ? (
          <Button 
            onClick={logout}
            variant="outline"
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        ) : (
          <Button 
            onClick={initiateLogin}
            className="w-full bg-orange-600 hover:bg-orange-700"
            disabled={loading}
          >
            <LogIn className="h-4 w-4 mr-2" />
            {loading ? "Connecting..." : "Connect to Zerodha"}
          </Button>
        )}

        <div className="text-xs text-slate-500">
          <p>• Secure OAuth authentication</p>
          <p>• Real-time market data</p>
          <p>• Live options chain</p>
        </div>
      </CardContent>
    </Card>
  );
};
