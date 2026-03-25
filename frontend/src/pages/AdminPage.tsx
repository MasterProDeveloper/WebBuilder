import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Activity, Server, Loader2 } from 'lucide-react';
import { adminApi } from '../lib/api';

interface AdminUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export default function AdminPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'health' | 'logs'>('users');

  useEffect(() => {
    Promise.all([
      adminApi.users().then(({ data }) => setUsers(data.users || [])),
      adminApi.health().then(({ data }) => setHealth(data)),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await adminApi.updateUser(userId, { is_active: !isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u))
      );
    } catch {
      // ignore
    }
  };

  const tabs = [
    { id: 'users' as const, label: 'Users', icon: Users },
    { id: 'health' as const, label: 'System Health', icon: Server },
    { id: 'logs' as const, label: 'Audit Logs', icon: Activity },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Shield className="w-7 h-7 text-primary-600" />
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.admin')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors ${
              activeTab === id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        </div>
      ) : (
        <>
          {/* Users tab */}
          {activeTab === 'users' && (
            <div className="card overflow-hidden p-0">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Last Login</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${user.role === 'admin' ? 'badge-error' : 'badge-info'}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${user.is_active ? 'badge-success' : 'badge-warning'}`}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => toggleUserStatus(user.id, user.is_active)}
                          className={`text-sm font-medium ${user.is_active ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}`}
                        >
                          {user.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Health tab */}
          {activeTab === 'health' && health && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-2">System Status</h3>
                <p className="text-2xl font-bold text-green-600 capitalize">{health.status}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Database</h3>
                <p className="text-2xl font-bold text-green-600 capitalize">{health.database}</p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Uptime</h3>
                <p className="text-2xl font-bold text-gray-900">
                  {health.uptime ? `${Math.floor(health.uptime / 3600)}h ${Math.floor((health.uptime % 3600) / 60)}m` : '--'}
                </p>
              </div>
              <div className="card">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Server Time</h3>
                <p className="text-lg font-mono text-gray-700">{health.serverTime}</p>
              </div>
            </div>
          )}

          {/* Logs tab */}
          {activeTab === 'logs' && (
            <div className="card text-center py-12 text-gray-400">
              <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Audit logs will appear here once system activity is recorded</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
