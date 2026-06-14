import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Send, BellRing } from 'lucide-react';
import { api } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Cart, ApiResponse } from '@xeno/types';

export function AbandonedCartsPage() {
  const [nudgedCarts, setNudgedCarts] = useState<Set<string>>(new Set());

  const { data: response, isLoading } = useQuery({
    queryKey: ['carts', 'abandoned'],
    queryFn: () => api.get<ApiResponse<Cart[]>>('/carts/abandoned'),
  });

  const abandonedCarts = response?.data || [];

  const handleNudge = (cartId: string) => {
    // In phase 2, this will trigger the agent to send an email.
    // For now, we simulate the action in the UI.
    setNudgedCarts(prev => {
      const newSet = new Set(prev);
      newSet.add(cartId);
      return newSet;
    });
  };

  const [isTriggering, setIsTriggering] = useState(false);

  const handleManualTrigger = async () => {
    setIsTriggering(true);
    try {
      await api.post('/carts/trigger-agent', {});
      // Refresh the carts list
      window.location.reload();
    } catch (error) {
      console.error('Failed to trigger agent', error);
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header flex justify-between items-center">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            Abandoned Carts
          </h1>
          <p className="page-subtitle">Monitor customers who left without checking out</p>
        </div>
        <button 
          onClick={handleManualTrigger}
          disabled={isTriggering}
          className="btn btn-primary"
        >
          {isTriggering ? 'Triggering...' : 'Trigger AI Agent'}
        </button>
      </div>

      {/* Stats/Info Banner */}
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
        <BellRing className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-medium text-blue-900">AI Nudge Agent</h3>
          <p className="text-sm text-blue-700 mt-1">
            The background agent automatically flags carts as abandoned every 4 hours. You can also click the "Trigger AI Agent" button to run it manually right now.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-th">Customer</th>
              <th className="table-th">Cart Value</th>
              <th className="table-th">Items Left Behind</th>
              <th className="table-th">Last Active</th>
              <th className="table-th text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 shimmer rounded" />
                    </td>
                  ))}
                </tr>
              ))
              : abandonedCarts?.map(cart => (
                <tr key={cart.id} className="table-row hover:bg-gray-50 transition-colors">
                  <td className="table-td">
                    <p className="font-medium text-gray-900">
                      {cart.customer?.firstName} {cart.customer?.lastName}
                    </p>
                    <p className="text-xs text-gray-400">{cart.customer?.email}</p>
                  </td>
                  <td className="table-td font-semibold text-orange-600 tabular-nums">
                    {formatCurrency(cart.totalValue)}
                  </td>
                  <td className="table-td">
                    <div className="flex flex-col gap-1">
                      {cart.items.slice(0, 2).map((item, idx) => (
                        <span key={idx} className="text-sm text-gray-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                          {item.qty}x {item.name}
                        </span>
                      ))}
                      {cart.items.length > 2 && (
                        <span className="text-xs text-gray-400 pl-2">
                          +{cart.items.length - 2} more items
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="table-td text-gray-500">
                    {formatDate(cart.lastActiveAt)}
                  </td>
                  <td className="table-td text-right">
                    {nudgedCarts.has(cart.id) ? (
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                        Nudged
                      </span>
                    ) : (
                      <button
                        onClick={() => handleNudge(cart.id)}
                        className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1.5 ml-auto"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send Nudge
                      </button>
                    )}
                  </td>
                </tr>
              ))
            }
            {abandonedCarts?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                  No abandoned carts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
