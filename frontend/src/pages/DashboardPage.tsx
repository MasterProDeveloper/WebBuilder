import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  MessageSquare,
  Users,
  TrendingUp,
  Trophy,
  Cloud,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { gamificationApi, taskApi, analyticsApi } from '../lib/api';

interface QuickStat {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [points, setPoints] = useState({ points: 0, level: 1, streak_days: 0 });
  const [taskStats, setTaskStats] = useState({ total: 0, completed: 0 });
  const [chatCount, setChatCount] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [recentTasks, setRecentTasks] = useState<Array<{ id: string; title: string; status: string; created_at: string }>>([]);

  useEffect(() => {
    gamificationApi.points().then(({ data }) => setPoints(data)).catch(() => {});

    taskApi.list({}).then(({ data }) => {
      const tasks = data.tasks || [];
      setTaskStats({
        total: data.total || tasks.length,
        completed: tasks.filter((t: { status: string }) => t.status === 'completed').length,
      });
      setRecentTasks(tasks.slice(0, 5));
    }).catch(() => {});

    analyticsApi.dashboard().then(({ data }) => {
      setChatCount(data.totalConversations || 0);
      setActiveUsers(data.activeUsers || 0);
    }).catch(() => {});
  }, []);

  const stats: QuickStat[] = [
    { label: t('dashboard.totalTasks'), value: String(taskStats.total), icon: CheckSquare, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: t('dashboard.completedTasks'), value: String(taskStats.completed), icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: t('dashboard.aiConversations'), value: String(chatCount), icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { label: t('dashboard.activeUsers'), value: String(activeUsers), icon: Users, color: 'text-orange-600', bgColor: 'bg-orange-100' },
  ];

  const quickActions = [
    { label: 'New AI Chat', icon: MessageSquare, path: '/chat', color: 'bg-purple-600' },
    { label: 'Create Task', icon: Plus, path: '/tasks', color: 'bg-blue-600' },
    { label: 'View Analytics', icon: TrendingUp, path: '/analytics', color: 'bg-green-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcome', { name: user?.first_name || 'User' })}
          </h1>
          <p className="text-gray-500 mt-1">{t('app.tagline')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="card flex items-center gap-3 py-3 px-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <div>
              <p className="text-sm font-semibold">{t('gamification.level')} {points.level}</p>
              <p className="text-xs text-gray-500">{points.points} {t('gamification.points')}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3 py-3 px-4">
            <Cloud className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-sm font-semibold">{points.streak_days} {t('gamification.streak')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bgColor }) => (
          <div key={label} className="card flex items-center gap-4">
            <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('dashboard.quickActions')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {quickActions.map(({ label, icon: Icon, path, color }) => (
            <button
              key={label}
              onClick={() => navigate(path)}
              className="card flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="font-medium text-gray-900">{label}</span>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            </button>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
        {recentTasks.length > 0 ? (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <CheckSquare className={`w-4 h-4 ${task.status === 'completed' ? 'text-green-500' : 'text-gray-400'}`} />
                  <span className="text-sm text-gray-700">{task.title}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  task.status === 'completed' ? 'bg-green-100 text-green-700' :
                  task.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Start using SiteCloud to see your activity here</p>
          </div>
        )}
      </div>
    </div>
  );
}
