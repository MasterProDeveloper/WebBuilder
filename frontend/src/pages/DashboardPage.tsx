import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  MessageSquare,
  Users,
  TrendingUp,
  Trophy,
  Zap,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { gamificationApi } from '../lib/api';

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

  useEffect(() => {
    gamificationApi.points().then(({ data }) => setPoints(data)).catch(() => {});
  }, []);

  const stats: QuickStat[] = [
    { label: t('dashboard.totalTasks'), value: '--', icon: CheckSquare, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { label: t('dashboard.completedTasks'), value: '--', icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-100' },
    { label: t('dashboard.aiConversations'), value: '--', icon: MessageSquare, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { label: t('dashboard.activeUsers'), value: '--', icon: Users, color: 'text-orange-600', bgColor: 'bg-orange-100' },
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
            <Zap className="w-5 h-5 text-orange-500" />
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

      {/* Recent Activity placeholder */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h2>
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Start using Lovable Bolt to see your activity here</p>
        </div>
      </div>
    </div>
  );
}
