import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, TrendingUp, Mail, Phone, MapPin, Tag } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatPercent, getHealthLabelClass, getHealthLabelText } from '../lib/utils';
import type { ApiResponse, PaginatedResponse, Customer } from '@xeno/types';
import { CustomerFormModal } from '../components/CustomerFormModal';

function HealthScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? '#16A34A' : score >= 60 ? '#2563EB' : score >= 40 ? '#D97706' : '#DC2626';
  const circumference = 2 * Math.PI * 18;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative w-10 h-10 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="18" fill="none" stroke="#F1F5F9" strokeWidth="3.5" />
        <circle
          cx="22" cy="22" r="18" fill="none" stroke={color} strokeWidth="3.5"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [healthLabel, setHealthLabel] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['customers', page, search, healthLabel],
    queryFn: () => api.get<PaginatedResponse<Customer>>(`/customers?page=${page}&search=${search}&healthLabel=${healthLabel}&pageSize=15`),
    placeholderData: prev => prev,
  });

  const { data: customerDetail } = useQuery({
    queryKey: ['customer', selected?.id],
    queryFn: () => selected ? api.get<ApiResponse<Customer>>(`/customers/${selected.id}`).then(r => r.data) : null,
    enabled: !!selected,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-subtitle">360° profiles with health scores and engagement data</p>
        </div>
        <button
          onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="input-customer-search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email…"
            className="w-full h-9 border border-gray-200 rounded-md pl-9 pr-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
          />
        </div>
        <select
          id="select-health-filter"
          value={healthLabel}
          onChange={e => { setHealthLabel(e.target.value); setPage(1); }}
          className="h-9 border border-gray-200 rounded-md px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">All health labels</option>
          <option value="HIGHLY_LOYAL">Highly Loyal</option>
          <option value="ACTIVE">Active</option>
          <option value="AT_RISK">At Risk</option>
          <option value="CHURN_RISK">Churn Risk</option>
        </select>
      </div>

      <div className="flex gap-5 items-start">
        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="table-container">
            <table className="w-full">
              <thead className="table-head">
                <tr>
                  <th className="table-th">Customer</th>
                  <th className="table-th">Health</th>
                  <th className="table-th">Spend</th>
                  <th className="table-th">Orders</th>
                  <th className="table-th">Last Order</th>
                  <th className="table-th">Open Rate</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i} className="table-row">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-4 py-3">
                          <div className="h-4 shimmer rounded" />
                        </td>
                      ))}
                    </tr>
                  ))
                  : data?.data.map(customer => (
                    <tr
                      key={customer.id}
                      onClick={() => setSelected(customer)}
                      className={`table-row cursor-pointer ${selected?.id === customer.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
                    >
                      <td className="table-td">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 flex-shrink-0">
                            {customer.firstName[0]}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{customer.firstName} {customer.lastName}</p>
                            <p className="text-xs text-gray-400">{customer.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-td">
                        <div className="flex items-center gap-2">
                          <HealthScoreRing score={customer.healthScore} />
                          <span className={`${getHealthLabelClass(customer.healthLabel)} hidden xl:inline`}>
                            {getHealthLabelText(customer.healthLabel)}
                          </span>
                        </div>
                      </td>
                      <td className="table-td font-semibold text-gray-900">{formatCurrency(customer.totalSpend)}</td>
                      <td className="table-td text-gray-500">{customer.orderCount}</td>
                      <td className="table-td text-gray-500">
                        {customer.daysSinceLastOrder ? `${customer.daysSinceLastOrder}d ago` : '—'}
                      </td>
                      <td className="table-td">{formatPercent(customer.emailOpenRate)}</td>
                    </tr>
                  ))
                }
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {data?.pagination.total?.toLocaleString()} customers
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost py-1 px-3 text-xs"
                >
                  Previous
                </button>
                <span className="text-xs text-gray-500 w-16 text-center">
                  {page} / {data?.pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= (data?.pagination.totalPages || 1)}
                  className="btn-ghost py-1 px-3 text-xs"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Customer 360 Panel */}
        {selected && (
          <div className="w-72 flex-shrink-0 animate-fade-in">
            <div className="card p-5 sticky top-0">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {selected.firstName[0]}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">
                      {selected.firstName} {selected.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{selected.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditingCustomer(selected); setIsModalOpen(true); }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium flex-shrink-0"
                >
                  Edit
                </button>
              </div>

              {/* Health score */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-4">
                <HealthScoreRing score={selected.healthScore} />
                <div>
                  <p className="text-sm font-bold text-gray-900">{selected.healthScore}/100</p>
                  <span className={getHealthLabelClass(selected.healthLabel)}>
                    {getHealthLabelText(selected.healthLabel)}
                  </span>
                </div>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {[
                  { label: 'Total Spend', value: formatCurrency(selected.totalSpend) },
                  { label: 'Orders', value: String(selected.orderCount) },
                  { label: 'Avg Order', value: formatCurrency(selected.avgOrderValue) },
                  { label: 'Days Inactive', value: selected.daysSinceLastOrder ? `${selected.daysSinceLastOrder}d` : '—' },
                  { label: 'Open Rate', value: formatPercent(selected.emailOpenRate) },
                  { label: 'Click Rate', value: formatPercent(selected.emailClickRate) },
                ].map(stat => (
                  <div key={stat.label} className="bg-gray-50 rounded-md p-2.5">
                    <p className="text-[11px] text-gray-400 mb-0.5">{stat.label}</p>
                    <p className="text-sm font-semibold text-gray-900">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Preferred category */}
              {selected.preferredCategory && (
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span className="text-xs text-gray-500">
                    Prefers <span className="font-medium text-gray-700">{selected.preferredCategory}</span>
                  </span>
                </div>
              )}

              {/* Tags */}
              {selected.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selected.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingCustomer(null); }}
        customer={editingCustomer}
      />
    </div>
  );
}
