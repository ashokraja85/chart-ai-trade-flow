
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Users, Settings, BarChart3, AlertCircle, Search } from "lucide-react";

const Admin = () => {
  const [activeTab, setActiveTab] = useState("users");

  const users = [
    { id: 1, name: "John Doe", email: "john@example.com", role: "User", status: "Active", trades: 45 },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "Premium", status: "Active", trades: 128 },
    { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "User", status: "Suspended", trades: 12 },
  ];

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
                  <p className="text-2xl font-bold text-white">1,247</p>
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
                  <p className="text-2xl font-bold text-white">8,934</p>
                  <p className="text-sm text-slate-400">AI Analyses</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Settings className="h-8 w-8 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-white">2,145</p>
                  <p className="text-sm text-slate-400">Active Trades</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-8 w-8 text-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-white">3</p>
                  <p className="text-sm text-slate-400">Flagged Users</p>
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
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input 
                        placeholder="Search users..." 
                        className="pl-10 w-64 bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left p-3 text-slate-400">User</th>
                        <th className="text-left p-3 text-slate-400">Role</th>
                        <th className="text-left p-3 text-slate-400">Status</th>
                        <th className="text-left p-3 text-slate-400">Trades</th>
                        <th className="text-left p-3 text-slate-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700">
                          <td className="p-3">
                            <div>
                              <p className="text-white font-medium">{user.name}</p>
                              <p className="text-slate-400 text-xs">{user.email}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline" className="border-blue-600 text-blue-400">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge className={user.status === 'Active' ? 'bg-green-600' : 'bg-red-600'}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-3 text-white">{user.trades}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" className="h-8 px-3 text-xs">
                                Edit
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 px-3 text-xs border-red-600 text-red-400">
                                Suspend
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">API Response Time</span>
                      <Badge className="bg-green-600">245ms</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Database Queries</span>
                      <Badge className="bg-green-600">Normal</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">WebSocket Connections</span>
                      <Badge className="bg-green-600">1,247</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">AI API Usage</span>
                      <Badge className="bg-yellow-600">78%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Export User Data
                    </Button>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      Generate Analytics Report
                    </Button>
                    <Button className="w-full bg-orange-600 hover:bg-orange-700">
                      Clear Cache
                    </Button>
                    <Button className="w-full bg-red-600 hover:bg-red-700">
                      Emergency Stop
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
