import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cloud, Brain, Shield, BarChart3, MessageSquare, Globe } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI-Powered Intelligence', desc: 'GPT-4 integration for chat, recommendations, and predictive analytics.' },
  { icon: Cloud, title: 'Lightning Performance', desc: 'Optimized architecture with caching, compression, and load balancing.' },
  { icon: Shield, title: 'Enterprise Security', desc: 'JWT auth, rate limiting, encryption, and DDoS protection built-in.' },
  { icon: BarChart3, title: 'Real-Time Analytics', desc: 'Interactive dashboards with live metrics and performance tracking.' },
  { icon: MessageSquare, title: 'Smart Automation', desc: 'Automated workflows, notifications, and intelligent task management.' },
  { icon: Globe, title: 'Multi-Language', desc: 'Full i18n support with 5 languages and RTL layout support.' },
];

export default function LandingPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3">
          <Cloud className="w-8 h-8 text-primary-400" />
          <span className="text-2xl font-bold">{t('app.name')}</span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
            {t('auth.login')}
          </Link>
          <Link to="/register" className="px-5 py-2.5 text-sm font-medium bg-primary-600 hover:bg-primary-500 rounded-lg transition-colors">
            {t('auth.register')}
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto text-center px-6 py-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary-500/20 rounded-full text-primary-300 text-sm font-medium mb-8">
          <Cloud className="w-4 h-4" />
          AI-Powered Platform
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          Handle Complex Tasks{' '}
          <span className="bg-gradient-to-r from-primary-400 to-accent-400 bg-clip-text text-transparent">
            With Ease
          </span>
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          {t('app.tagline')}. Powered by cutting-edge AI, built for performance, designed for scale.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            to="/register"
            className="px-8 py-3.5 bg-primary-600 hover:bg-primary-500 rounded-lg font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25"
          >
            Get Started Free
          </Link>
          <a
            href="#features"
            className="px-8 py-3.5 border border-gray-600 hover:border-gray-400 rounded-lg font-semibold text-lg transition-colors"
          >
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Everything You Need</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
            >
              <div className="w-12 h-12 bg-primary-500/20 rounded-lg flex items-center justify-center mb-4">
                <Icon className="w-6 h-6 text-primary-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="border-t border-white/10 py-16">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '99.9%', label: 'Uptime SLA' },
            { value: '<50ms', label: 'API Latency' },
            { value: '5', label: 'Languages' },
            { value: 'GPT-4', label: 'AI Model' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-primary-400">{value}</div>
              <div className="text-sm text-gray-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} SiteCloud. Built with performance and intelligence in mind.</p>
      </footer>
    </div>
  );
}
