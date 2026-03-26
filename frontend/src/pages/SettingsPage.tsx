import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Globe, User, Shield } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { languages } from '../i18n';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const loadUser = useAuthStore((s) => s.loadUser);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authApi.updateProfile(form);
      await loadUser();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      // ignore
    }
  };

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('language', code);
  };

  return (
    <div className="max-w-2xl space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900">{t('nav.settings')}</h1>

      {/* Profile */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Profile</h2>
        </div>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.firstName')}</label>
              <input
                type="text"
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.lastName')}</label>
              <input
                type="text"
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.email')}</label>
            <input type="email" value={user?.email || ''} className="input-field bg-gray-50" disabled />
          </div>
          <button type="submit" className="btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {t('common.save')}
          </button>
          {saved && <p className="text-sm text-green-600">Profile saved successfully!</p>}
        </form>
      </div>

      {/* Language */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Language</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                i18n.language === lang.code
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
      </div>

      {/* Security */}
      <div className="card">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-gray-400" />
          <h2 className="text-lg font-semibold">Security</h2>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span>Two-factor authentication</span>
            <span className="badge-warning">Coming soon</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span>Active sessions</span>
            <span className="badge-success">1 session</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span>Account role</span>
            <span className="badge-info">{user?.role || 'user'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
