import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Search, Edit, Shield, UserX } from "lucide-react";
import { useAdminUsers, AdminUser } from "@/hooks/useAdminUsers";
import { useState } from "react";

export const UserManagementTable = () => {
  const { users, loading, searchTerm, setSearchTerm, updateUserRole } = useAdminUsers();
  const [editingUser, setEditingUser] = useState<string | null>(null);

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600 text-white';
      case 'premium': return 'bg-purple-600 text-white';
      case 'user': return 'bg-blue-600 text-white';
      default: return 'bg-slate-600 text-white';
    }
  };

  const getStatusBadgeColor = (user: AdminUser) => {
    if (user.email_confirmed_at) return 'bg-green-600 text-white';
    return 'bg-yellow-600 text-white';
  };

  const handleRoleUpdate = async (userId: string, newRole: string) => {
    await updateUserRole(userId, newRole);
    setEditingUser(null);
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-slate-700 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
        <Input 
          placeholder="Search users by email or name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-700 border-slate-600 text-white"
        />
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left p-3 text-slate-400 font-medium">User</th>
              <th className="text-left p-3 text-slate-400 font-medium">Role</th>
              <th className="text-left p-3 text-slate-400 font-medium">Status</th>
              <th className="text-left p-3 text-slate-400 font-medium">Activity</th>
              <th className="text-left p-3 text-slate-400 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                <td className="p-3">
                  <div>
                    <p className="text-white font-medium">
                      {user.full_name || 'Unnamed User'}
                    </p>
                    <p className="text-slate-400 text-xs">{user.email}</p>
                    <p className="text-slate-500 text-xs">
                      Joined {new Date(user.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </td>
                <td className="p-3">
                  {editingUser === user.id ? (
                    <Select 
                      defaultValue={user.role || 'user'} 
                      onValueChange={(value) => handleRoleUpdate(user.id, value)}
                    >
                      <SelectTrigger className="w-24 h-8 bg-slate-600 border-slate-500">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge className={getRoleBadgeColor(user.role || 'user')}>
                      {user.role || 'user'}
                    </Badge>
                  )}
                </td>
                <td className="p-3">
                  <Badge className={getStatusBadgeColor(user)}>
                    {user.email_confirmed_at ? 'Active' : 'Pending'}
                  </Badge>
                </td>
                <td className="p-3">
                  <div className="text-xs text-slate-300">
                    <p>{user.trade_count} trades</p>
                    <p>{user.ai_usage_count} AI analyses</p>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2"
                      onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2 border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                    >
                      <Shield className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-8 px-2 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <UserX className="h-3 w-3" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {users.length === 0 && (
          <div className="text-center py-8 text-slate-400">
            No users found matching your search.
          </div>
        )}
      </div>
    </div>
  );
};