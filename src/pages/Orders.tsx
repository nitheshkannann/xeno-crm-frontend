import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, X, Megaphone } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import type { PaginatedResponse, Order, Customer } from '@xeno/types';

const STATUS_MAP: Record<string, string> = {
  DELIVERED: 'badge-success',
  SHIPPED: 'badge-info',
  PENDING: 'badge-neutral',
  CANCELLED: 'badge-danger',
  RETURNED: 'badge-danger',
  PROCESSING: 'badge-warning',
};

export function OrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, search, status],
    queryFn: () => api.get<PaginatedResponse<Order>>(`/orders?page=${page}&search=${search}&status=${status}&pageSize=20`),
    placeholderData: prev => prev,
  });

  const { data: campaignOrders, isLoading: isLoadingCampaign } = useQuery({
    queryKey: ['campaign-orders', selectedCampaignId],
    queryFn: async () => {
      if (!selectedCampaignId) return null;
      const res = await api.get<{ data: Order[] }>(`/campaigns/${selectedCampaignId}/orders`);
      return res.data;
    },
    enabled: !!selectedCampaignId,
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-subtitle">Full order history across all customers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="input-order-search"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by customer name or email…"
            className="w-full h-9 border border-gray-200 rounded-md pl-9 pr-3 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        <select
          id="select-order-status"
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="h-9 border border-gray-200 rounded-md px-3 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
        >
          <option value="">All statuses</option>
          {['DELIVERED', 'SHIPPED', 'PENDING', 'PROCESSING', 'CANCELLED', 'RETURNED'].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              {['Customer', 'Campaign', 'Amount', 'Items', 'Status', 'Date'].map(h => (
                <th key={h} className="table-th">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 10 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 shimmer rounded" />
                    </td>
                  ))}
                </tr>
              ))
              : data?.data.map(order => (
                <tr key={order.id} className="table-row">
                  <td className="table-td">
                    <p className="font-medium text-gray-900">
                      {order.customer?.firstName} {order.customer?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{order.customer?.email}</p>
                  </td>
                  <td className="table-td">
                    {order.campaign ? (
                      <button 
                        onClick={() => setSelectedCampaignId(order.campaign!.id)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-200"
                      >
                        <Megaphone className="w-3 h-3" />
                        {order.campaign.name}
                      </button>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Organic</span>
                    )}
                  </td>
                  <td className="table-td font-semibold text-green-700 tabular-nums">
                    {formatCurrency(order.amount)}
                  </td>
                  <td className="table-td text-gray-500">
                    {(order.items as unknown[]).length} item{(order.items as unknown[]).length !== 1 ? 's' : ''}
                  </td>
                  <td className="table-td">
                    <span className={STATUS_MAP[order.status] || 'badge-neutral'}>{order.status}</span>
                  </td>
                  <td className="table-td text-gray-500">{formatDate(order.createdAt)}</td>
                </tr>
              ))
            }
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{data?.pagination.total?.toLocaleString()} orders</p>
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

      {/* Campaign Slide-over Panel */}
      {selectedCampaignId && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setSelectedCampaignId(null)} 
          />
          <div className="fixed inset-y-0 right-0 w-[450px] bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900">Campaign Conversions</h2>
                  <p className="text-xs text-gray-500">{campaignOrders?.length || 0} orders attributed</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCampaignId(null)}
                className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {isLoadingCampaign ? (
                <div className="flex justify-center py-12">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : campaignOrders?.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">No orders found for this campaign.</div>
              ) : (
                <div className="space-y-3">
                  {campaignOrders?.map(order => (
                    <div key={order.id} className="p-4 rounded-xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {order.customer?.firstName} {order.customer?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{order.customer?.email}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-600">{formatCurrency(order.amount)}</p>
                        <span className={`inline-block mt-1 scale-90 origin-right ${STATUS_MAP[order.status] || 'badge-neutral'}`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {campaignOrders && campaignOrders.length > 0 && (
              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Total Campaign Revenue</span>
                  <span className="font-bold text-gray-900 text-lg">
                    {formatCurrency(campaignOrders.reduce((sum, o) => sum + o.amount, 0))}
                  </span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
