import { useQuery } from '@tanstack/react-query';
import { TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, formatNumber } from '../lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import type { ApiResponse, AnalyticsOverview, AnalyticsTrend } from '@xeno/types';

const tooltipStyle = {
  background: '#fff',
  border: '1px solid #E2E8F0',
  borderRadius: '6px',
  fontSize: '12px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

export function AnalyticsPage() {
  const { data: overview } = useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: () => api.get<ApiResponse<AnalyticsOverview>>('/analytics/overview').then(r => r.data),
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics', 'trends', 30],
    queryFn: () => api.get<ApiResponse<AnalyticsTrend[]>>('/analytics/trends?days=30').then(r => r.data),
  });

  const { data: healthDist } = useQuery({
    queryKey: ['analytics', 'health-distribution'],
    queryFn: () => api.get<ApiResponse<{ healthLabel: string; _count: { id: number }; _avg: { totalSpend: number } }[]>>('/analytics/health-distribution').then(r => r.data),
  });

  const { data: campaignPerf } = useQuery({
    queryKey: ['analytics', 'campaigns'],
    queryFn: () => api.get<ApiResponse<Record<string, unknown>[]>>('/analytics/campaigns').then(r => r.data),
  });

  const chartData = trends?.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    messagesSent: t.messagesSent,
    opened: t.opened,
    clicked: t.clicked,
    converted: t.converted,
    revenue: Math.round(t.revenue),
  })) || [];

  const healthChartData = healthDist?.map(h => ({
    label: h.healthLabel.replace('_', ' '),
    count: h._count.id,
    avgSpend: Math.round(h._avg.totalSpend || 0),
  })) || [];

  const healthColors = ['#16A34A', '#2563EB', '#D97706', '#DC2626'];

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatCurrency(overview?.totalRevenue || 0),
      change: '8.3%',
      positive: true,
    },
    {
      label: 'Avg Open Rate',
      value: formatPercent(overview?.avgOpenRate || 0),
      change: 'vs 21% avg',
      positive: (overview?.avgOpenRate || 0) > 0.21,
    },
    {
      label: 'Avg Click Rate',
      value: formatPercent(overview?.avgClickRate || 0),
      change: 'vs 3% avg',
      positive: (overview?.avgClickRate || 0) > 0.03,
    },
    {
      label: 'Conversion Rate',
      value: formatPercent(overview?.avgConversionRate || 0),
      change: 'vs 2% avg',
      positive: (overview?.avgConversionRate || 0) > 0.02,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Campaign performance and customer engagement metrics</p>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="stat-card">
            <p className="text-2xl font-bold text-gray-900 tabular-nums mb-0.5">{kpi.value}</p>
            <p className="text-sm text-gray-500">{kpi.label}</p>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${kpi.positive ? 'text-green-600' : 'text-amber-600'}`}>
              {kpi.positive
                ? <ArrowUp className="w-3 h-3" />
                : <ArrowDown className="w-3 h-3" />
              }
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-5">
        {/* Engagement chart */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Message Engagement</h3>
            <p className="text-xs text-gray-500 mt-0.5">Messages sent, opened, and clicked — last 30 days</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                {[
                  ['sent', '#2563EB'],
                  ['opened', '#16A34A'],
                  ['clicked', '#7C3AED'],
                ].map(([key, color]) => (
                  <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.12} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: '#64748B', fontWeight: 500 }} />
              <Area type="monotone" dataKey="messagesSent" stroke="#2563EB" fill="url(#color-sent)" strokeWidth={1.5} name="Sent" />
              <Area type="monotone" dataKey="opened" stroke="#16A34A" fill="url(#color-opened)" strokeWidth={1.5} name="Opened" />
              <Area type="monotone" dataKey="clicked" stroke="#7C3AED" fill="url(#color-clicked)" strokeWidth={1.5} name="Clicked" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-gray-100">
            {[
              { color: '#2563EB', label: 'Sent' },
              { color: '#16A34A', label: 'Opened' },
              { color: '#7C3AED', label: 'Clicked' },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-0.5 rounded" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-gray-500">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Health distribution */}
        <div className="card p-5">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Customer Health Distribution</h3>
            <p className="text-xs text-gray-500 mt-0.5">Customers by RFM health score category</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={healthChartData} barSize={40} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v) => formatNumber(Number(v))}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Customers">
                {healthChartData.map((_, i) => (
                  <Cell key={i} fill={healthColors[i % healthColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign performance table */}
      {campaignPerf && campaignPerf.length > 0 && (
        <div className="table-container">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Campaign Performance</h3>
          </div>
          <table className="w-full">
            <thead className="table-head">
              <tr>
                {['Campaign', 'Segment', 'Channel', 'Sent', 'Open Rate', 'Click Rate', 'Conversion'].map(h => (
                  <th key={h} className="table-th">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaignPerf.slice(0, 10).map(c => {
                const stats = c.stats as { total: number; openRate: number; clickRate: number; conversionRate: number };
                return (
                  <tr key={c.id as string} className="table-row">
                    <td className="table-td font-medium text-gray-900 truncate max-w-[180px]">{String(c.name || '')}</td>
                    <td className="table-td text-gray-500">{String((c.segment as { name: string })?.name || '')}</td>
                    <td className="table-td">
                      <span className="badge-neutral">{String(c.channel || '')}</span>
                    </td>
                    <td className="table-td tabular-nums">{formatNumber(stats?.total || 0)}</td>
                    <td className="table-td">
                      <span className="font-semibold text-blue-700">{formatPercent(stats?.openRate || 0)}</span>
                    </td>
                    <td className="table-td">
                      <span className="font-semibold text-violet-700">{formatPercent(stats?.clickRate || 0)}</span>
                    </td>
                    <td className="table-td">
                      <span className="font-semibold text-green-700">{formatPercent(stats?.conversionRate || 0)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
