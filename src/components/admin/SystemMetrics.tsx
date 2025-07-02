import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle 
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";

export const SystemMetrics = () => {
  const { stats, loading } = useAdminStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-slate-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-600 text-white';
      case 'warning': return 'bg-yellow-600 text-white';
      case 'error': return 'bg-red-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-48 bg-slate-700 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* API Performance */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-400" />
            API Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Response Time</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(stats.systemHealth.databaseStatus)}
              <span className="text-white font-medium">
                {stats.systemHealth.apiResponseTime}ms
              </span>
            </div>
          </div>
          <Progress 
            value={Math.max(0, 100 - (stats.systemHealth.apiResponseTime / 10))} 
            className="h-2"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>0ms</span>
            <span>1000ms+</span>
          </div>
        </CardContent>
      </Card>

      {/* Database Health */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Database className="h-5 w-5 text-green-400" />
            Database Health
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Status</span>
            <Badge className={getStatusBadge(stats.systemHealth.databaseStatus)}>
              {stats.systemHealth.databaseStatus}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Cache Hit Rate</span>
            <span className="text-white font-medium">
              {stats.systemHealth.cacheHitRate.toFixed(1)}%
            </span>
          </div>
          <Progress value={stats.systemHealth.cacheHitRate} className="h-2" />
        </CardContent>
      </Card>

      {/* User Activity */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-purple-400" />
            User Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Total Users</p>
              <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Active (30d)</p>
              <p className="text-2xl font-bold text-green-400">{stats.activeUsers}</p>
            </div>
          </div>
          <div className="pt-2">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Activity Rate</span>
              <span>{((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100).toFixed(1)}%</span>
            </div>
            <Progress 
              value={(stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* System Overview */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            System Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Total Trades</span>
              <span className="text-white font-medium">{stats.totalTrades.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">AI Analyses</span>
              <span className="text-white font-medium">{stats.totalAiAnalyses.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Error Rate</span>
              <span className={`font-medium ${
                stats.systemHealth.errorRate < 1 ? 'text-green-400' : 
                stats.systemHealth.errorRate < 2 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {stats.systemHealth.errorRate.toFixed(2)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};