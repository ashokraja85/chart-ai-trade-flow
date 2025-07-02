
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Settings, BarChart3, AlertCircle, Activity, TrendingUp } from "lucide-react";
import { UserManagementTable } from "@/components/admin/UserManagementTable";
import { SystemMetrics } from "@/components/admin/SystemMetrics";
import { useAdminStats } from "@/hooks/useAdminStats";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");
  const { stats, loading } = useAdminStats();

  const aiLogs = [
    { id: 1, user: "john@example.com", symbol: "NIFTY", prompt: "Analyze current trend", timestamp: "2023-11-25 10:30:00" },
    { id: 2, user: "jane@example.com", symbol: "BANKNIFTY", prompt: "Screenshot analysis", timestamp: "2023-11-25 10:25:00" },
    { id: 3, user: "mike@example.com", symbol: "RELIANCE", prompt: "Pattern recognition", timestamp: "2023-11-25 10:20:00" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
            <p className="text-slate-400">System monitoring and user management</p>
          </div>
          <Badge className="bg-red-600 text-white">Super Admin</Badge>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.totalUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-green-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.totalAiAnalyses.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400">AI Analyses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.totalTrades.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400">Total Trades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {loading ? "..." : stats.activeUsers.toLocaleString()}
                  </p>
                  <p className="text-sm text-slate-400">Active Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-slate-700">
              Users
            </TabsTrigger>
            <TabsTrigger value="ai-logs" className="text-white data-[state=active]:bg-slate-700">
              AI Logs
            </TabsTrigger>
            <TabsTrigger value="features" className="text-white data-[state=active]:bg-slate-700">
              Features
            </TabsTrigger>
            <TabsTrigger value="system" className="text-white data-[state=active]:bg-slate-700">
              System
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <UserManagementTable />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-logs" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">AI Usage Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {aiLogs.map((log) => (
                    <div key={log.id} className="bg-slate-700 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{log.user}</span>
                        <span className="text-xs text-slate-400">{log.timestamp}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline" className="border-green-600 text-green-400">
                          {log.symbol}
                        </Badge>
                        <span className="text-slate-300">{log.prompt}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Feature Toggles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: "AI Screenshot Analysis", enabled: true },
                    { name: "Paper Trading Mode", enabled: false },
                    { name: "Real-time Alerts", enabled: true },
                    { name: "Options Trading", enabled: true },
                    { name: "Beta Features", enabled: false },
                  ].map((feature) => (
                    <div key={feature.name} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <span className="text-white">{feature.name}</span>
                      <Button 
                        size="sm" 
                        className={feature.enabled ? 'bg-green-600 hover:bg-green-700' : 'bg-slate-600 hover:bg-slate-500'}
                      >
                        {feature.enabled ? 'Enabled' : 'Disabled'}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="mt-6">
            <SystemMetrics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
