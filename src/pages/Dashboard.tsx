import { useQuery } from '@tanstack/react-query';
import { Users, Megaphone, TrendingUp, AlertTriangle, Activity, ArrowUp, Bot, Target } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { ApiResponse, AnalyticsOverview, AnalyticsTrend } from '@xeno/types';
import { Link } from 'react-router-dom';

function StatCard({
  label, value, sub, icon: Icon, iconColor, iconBg, trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-500'}`}>
            <ArrowUp className={`w-3 h-3 ${!trend.positive ? 'rotate-180' : ''}`} />
            {trend.value}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get<ApiResponse<AnalyticsOverview>>('/analytics/overview').then(r => r.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: () => api.get<ApiResponse<AnalyticsTrend[]>>('/analytics/trends?days=14').then(r => r.data),
  });

  const { data: healthDist } = useQuery({
    queryKey: ['analytics', 'health-distribution'],
    queryFn: () => api.get<ApiResponse<{ healthLabel: string; _count: { id: number }; _avg: { healthScore: number } }[]>>('/analytics/health-distribution').then(r => r.data),
  });

  const chartData = trends?.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    sent: t.messagesSent,
    opened: t.opened,
    converted: t.converted,
  })) || [];

  const healthColors: Record<string, string> = {
    HIGHLY_LOYAL: '#16A34A',
    ACTIVE: '#2563EB',
    AT_RISK: '#D97706',
    CHURN_RISK: '#DC2626',
  };

  const tooltipStyle = {
    background: '#fff',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    fontSize: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Marketing performance overview</p>
        </div>
        <Link to="/ai-agent" id="btn-open-ai-agent" className="btn-primary">
          <Bot className="w-4 h-4" />
          Launch AI Agent
        </Link>
      </div>

      {/* KPI Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Customers"
          value={formatNumber(overview?.totalCustomers || 0)}
          sub={`${formatNumber(overview?.activeCustomers || 0)} active`}
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          trend={{ value: '12%', positive: true }}
        />
        <StatCard
          label="At Risk"
          value={formatNumber((overview as unknown as Record<string, number>)?.atRiskCustomers || 0)}
          sub="Need attention"
          icon={AlertTriangle}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <StatCard
          label="Churn Risk"
          value={formatNumber((overview as unknown as Record<string, number>)?.churnRiskCustomers || 0)}
          sub="Act immediately"
          icon={Activity}
          iconBg="bg-red-50"
          iconColor="text-red-600"
        />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(overview?.totalRevenue || 0)}
          sub="Lifetime value"
          icon={TrendingUp}
          iconBg="bg-green-50"
          iconColor="text-green-600"
          trend={{ value: '8.3%', positive: true }}
        />
      </div>

      {/* KPI Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Campaigns"
          value={formatNumber(overview?.totalCampaigns || 0)}
          sub={`${overview?.activeCampaigns || 0} running`}
          icon={Megaphone}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
        />
        <StatCard
          label="Avg Open Rate"
          value={formatPercent(overview?.avgOpenRate || 0)}
          sub="Industry avg: 21%"
          icon={TrendingUp}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
          trend={{
            value: overview?.avgOpenRate && overview.avgOpenRate > 0.21 ? 'Above avg' : 'Below avg',
            positive: (overview?.avgOpenRate || 0) > 0.21,
          }}
        />
        <StatCard
          label="Avg Click Rate"
          value={formatPercent(overview?.avgClickRate || 0)}
          sub="Industry avg: 3%"
          icon={Target}
          iconBg="bg-cyan-50"
          iconColor="text-cyan-600"
        />
        <StatCard
          label="Conversion Rate"
          value={formatPercent(overview?.avgConversionRate || 0)}
          sub="Per clicked message"
          icon={ArrowUp}
          iconBg="bg-pink-50"
          iconColor="text-pink-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-5">
        {/* Message Performance Chart */}
        <div className="col-span-2 card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Message Performance</h3>
            <p className="text-xs text-gray-500 mt-0.5">Sent vs Opened vs Converted — last 14 days</p>
          </div>
          {/* Explicit pixel height wrapper — required for Recharts ResponsiveContainer */}
          <div style={{ width: '100%', height: 200 }}>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#64748B', fontWeight: 500 }} />
                  <Area type="monotone" dataKey="sent" stroke="#6366f1" fill="url(#colorSent)" strokeWidth={2} name="Sent" />
                  <Area type="monotone" dataKey="opened" stroke="#10b981" fill="url(#colorOpened)" strokeWidth={2} name="Opened" />
                  <Line type="monotone" dataKey="converted" stroke="#f59e0b" strokeWidth={2} dot={false} name="Converted" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-gray-400">No trend data available yet</p>
              </div>
            )}
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-150">
            {[
              { color: '#6366f1', label: 'Sent' },
              { color: '#10b981', label: 'Opened' },
              { color: '#f59e0b', label: 'Converted' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Customer Health */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white">Customer Health</h3>
            <p className="text-xs text-gray-500 mt-0.5">RFM + engagement scores</p>
          </div>
          <div className="space-y-4">
            {healthDist?.map(h => {
              const total = healthDist.reduce((s, x) => s + x._count.id, 0);
              const pct = total > 0 ? (h._count.id / total) * 100 : 0;
              const label = h.healthLabel.replace('_', ' ').replace(/(^\w|\s\w)/g, m => m.toUpperCase());
              return (
                <div key={h.healthLabel}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-600 font-medium">{label}</span>
                    <span className="text-gray-500 tabular-nums">{h._count.id.toLocaleString()}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: healthColors[h.healthLabel] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-500 mb-3">Quick AI Actions</p>
            <div className="space-y-2">
              <Link
                to="/ai-agent?goal=Re-engage+at-risk+customers"
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                Re-engage at-risk customers
              </Link>
              <Link
                to="/ai-agent?goal=Win+back+churn+risk+customers"
                className="flex items-center gap-2 text-xs text-blue-600 hover:text-blue-700 transition-colors font-medium"
              >
                <Bot className="w-3.5 h-3.5 flex-shrink-0" />
                Win back churn risk customers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
