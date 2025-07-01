
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  Settings, 
  Users, 
  TrendingUp,
  LogOut
} from "lucide-react";

export const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: BarChart3 },
    { path: "/admin", label: "Admin", icon: Settings },
  ];

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <span className="text-xl font-bold text-white">TradingAI</span>
            <Badge className="bg-blue-600 text-white text-xs">BETA</Badge>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path}>
                <Button
                  variant="ghost"
                  className={`flex items-center gap-2 ${
                    location.pathname === item.path
                      ? 'text-white bg-slate-700'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400">Welcome, Trader</span>
            <Button size="sm" variant="outline" className="text-slate-300 border-slate-600 hover:bg-slate-700">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
