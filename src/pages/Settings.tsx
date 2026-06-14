import { useAuthStore } from '../stores/authStore';
import { Calendar, Shield, Zap, User, Mail, Briefcase } from 'lucide-react';

function SettingSection({
  title,
  icon: Icon,
  iconColor = 'text-gray-600',
  iconBg = 'bg-gray-100',
  badge,
  children,
}: {
  title: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {badge}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function StatusRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
      <div>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
      </div>
      <span className="badge-success">Active</span>
    </div>
  );
}

export function SettingsPage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Platform configuration and account preferences</p>
        </div>
      </div>

      {/* Account */}
      <SettingSection title="Account" icon={Shield} iconBg="bg-gray-100" iconColor="text-gray-600">
        <div className="grid grid-cols-3 gap-6">
          <InfoRow label="Full name" value={user?.name || '—'} />
          <InfoRow label="Email address" value={user?.email || '—'} />
          <InfoRow label="Role" value={user?.role ? user.role.charAt(0) + user.role.slice(1).toLowerCase() : '—'} />
        </div>
      </SettingSection>

      {/* Auto Scheduler */}
      <SettingSection
        title="Monthly Auto-Scheduler"
        icon={Calendar}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        badge={<span className="badge-success ml-auto">Active</span>}
      >
        <p className="text-sm text-gray-500 mb-4 leading-relaxed">
          Campaigns are automatically generated and launched on the{' '}
          <span className="font-semibold text-gray-800">1st of every month at 9:00 AM IST</span>{' '}
          for all segments with auto-scheduling enabled.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Enable auto-scheduling on individual segments from the{' '}
          <a href="/segments" className="text-blue-600 hover:text-blue-700 font-medium">Segments</a> page.
        </p>
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
          <p className="text-xs text-gray-500">
            Health scores refresh nightly at{' '}
            <span className="font-semibold text-gray-700">2:00 AM IST</span>
          </p>
        </div>
      </SettingSection>

      {/* AI Configuration */}
      <SettingSection
        title="AI Configuration"
        icon={Zap}
        iconBg="bg-violet-50"
        iconColor="text-violet-600"
      >
        <div className="space-y-2">
          <StatusRow
            title="AI Provider"
            subtitle="Google Gemini 1.5 Flash"
          />
          <StatusRow
            title="AI Features"
            subtitle="Segment Builder · Campaign Writer · Agent · Insights"
          />
          <StatusRow
            title="Marketing Memory"
            subtitle="AI learns from past campaign performance"
          />
        </div>
      </SettingSection>
    </div>
  );
}
