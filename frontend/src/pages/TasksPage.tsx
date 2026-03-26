import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, CheckCircle, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { taskApi } from '../lib/api';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  in_progress: { icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  failed: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
};

const priorityColors: Record<string, string> = {
  low: 'badge-info',
  medium: 'badge-warning',
  high: 'badge bg-orange-100 text-orange-800',
  critical: 'badge-error',
};

export default function TasksPage() {
  const { t } = useTranslation();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium' });

  useEffect(() => {
    loadTasks();
  }, [filter]);

  const loadTasks = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {};
      if (filter !== 'all') params.status = filter;
      const { data } = await taskApi.list(params);
      setTasks(data.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await taskApi.create(newTask);
      setNewTask({ title: '', description: '', priority: 'medium' });
      setShowCreate(false);
      loadTasks();
    } catch {
      // ignore
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await taskApi.update(id, { status });
      loadTasks();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.tasks')}</h1>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4 mr-2" />
          {t('tasks.create')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'in_progress', 'completed', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              filter === s ? 'bg-primary-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {s === 'all' ? 'All' : t(`tasks.${s === 'in_progress' ? 'inProgress' : s}`)}
          </button>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="card border-primary-200 border-2">
          <h3 className="text-lg font-semibold mb-4">{t('tasks.create')}</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => setNewTask((t) => ({ ...t, title: e.target.value }))}
              placeholder={t('tasks.title')}
              className="input-field"
              required
            />
            <textarea
              value={newTask.description}
              onChange={(e) => setNewTask((t) => ({ ...t, description: e.target.value }))}
              placeholder={t('tasks.description')}
              className="input-field"
              rows={3}
            />
            <select
              value={newTask.priority}
              onChange={(e) => setNewTask((t) => ({ ...t, priority: e.target.value }))}
              className="input-field"
            >
              <option value="low">{t('tasks.low')}</option>
              <option value="medium">{t('tasks.medium')}</option>
              <option value="high">{t('tasks.high')}</option>
              <option value="critical">{t('tasks.critical')}</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" className="btn-primary">{t('common.save')}</button>
              <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary">{t('common.cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('common.noResults')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => {
            const cfg = statusConfig[task.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            return (
              <div key={task.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${cfg.bg} rounded-lg flex items-center justify-center`}>
                    <StatusIcon className={`w-5 h-5 ${cfg.color}`} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{task.title}</h3>
                    {task.description && <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={priorityColors[task.priority] || 'badge-info'}>
                    {task.priority}
                  </span>
                  {task.status !== 'completed' && (
                    <button
                      onClick={() => updateStatus(task.id, 'completed')}
                      className="text-sm text-green-600 hover:text-green-700 font-medium"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
