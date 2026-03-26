import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, Users, Activity, Loader2 } from 'lucide-react';
import { analyticsApi } from '../lib/api';

interface DashboardMetrics {
  totalUsers: number;
  activeUsers: number;
  totalTasks: number;
  completedTasks: number;
  totalConversations: number;
  totalMessages: number;
  avgTaskCompletionTime: number;
  topEvents: Array<{ event_type: string; count: number }>;
}

export default function AnalyticsPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi
      .dashboard()
      .then(({ data }) => setMetrics(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  const cards = [
    { label: 'Total Users', value: metrics?.totalUsers || 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Active Users', value: metrics?.activeUsers || 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Tasks Completed', value: metrics?.completedTasks || 0, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-100' },
    { label: 'AI Conversations', value: metrics?.totalConversations || 0, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.analytics')}</h1>

      {/* Metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{label}</span>
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                <Icon className={`w-5 h-5 ${color}`} />
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">{value.toLocaleString()}</p>
          </div>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion Rate</h3>
          <div className="flex items-end gap-4">
            <span className="text-4xl font-bold text-primary-600">
              {metrics && metrics.totalTasks > 0
                ? Math.round((metrics.completedTasks / metrics.totalTasks) * 100)
                : 0}
              %
            </span>
            <span className="text-sm text-gray-500 mb-1">
              {metrics?.completedTasks || 0} of {metrics?.totalTasks || 0} tasks
            </span>
          </div>
          <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{
                width: `${
                  metrics && metrics.totalTasks > 0
                    ? (metrics.completedTasks / metrics.totalTasks) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Events (7 days)</h3>
          {metrics?.topEvents && metrics.topEvents.length > 0 ? (
            <div className="space-y-3">
              {metrics.topEvents.slice(0, 5).map((event) => (
                <div key={event.event_type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 font-mono">{event.event_type}</span>
                  <span className="text-sm font-semibold text-gray-900">{event.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm">No events recorded yet. Start using the platform to generate analytics data.</p>
          )}
        </div>
      </div>

      {/* Average task completion */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Performance Overview</h3>
        <div className="grid grid-cols-3 gap-6 mt-4">
          <div>
            <p className="text-sm text-gray-500">Avg Completion Time</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics?.avgTaskCompletionTime ? `${metrics.avgTaskCompletionTime.toFixed(1)}h` : '--'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Messages</p>
            <p className="text-2xl font-bold text-gray-900">{metrics?.totalMessages || 0}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">User Engagement</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics && metrics.totalUsers > 0
                ? `${Math.round((metrics.activeUsers / metrics.totalUsers) * 100)}%`
                : '--'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
