import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Save, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Customer } from '@xeno/types';

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export function CustomerFormModal({ isOpen, onClose, customer }: CustomerFormModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!customer;

  const [formData, setFormData] = useState({
    firstName: customer?.firstName || '',
    lastName: customer?.lastName || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    city: customer?.city || '',
    state: customer?.state || '',
    gender: customer?.gender || 'OTHER',
    preferredCategory: customer?.preferredCategory || 'Electronics',
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (isEditing) {
        return api.patch(`/customers/${customer.id}`, data);
      } else {
        return api.post(`/customers`, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ['customer', customer.id] });
      }
      onClose();
    },
  });

  if (!isOpen) return null;

  const inputCls = "w-full h-9 border border-gray-200 rounded-md px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors";
  const labelCls = "text-xs font-medium text-gray-600 block mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-lg flex flex-col max-h-[90vh] animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900">
            {isEditing ? 'Edit Customer' : 'New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name</label>
              <input
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                className={inputCls}
                placeholder="John"
              />
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                className={inputCls}
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Email Address</label>
            <input
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className={inputCls}
              placeholder="john@example.com"
              type="email"
            />
          </div>

          <div>
            <label className={labelCls}>Phone Number</label>
            <input
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className={inputCls}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>City</label>
              <input
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className={inputCls}
                placeholder="Mumbai"
              />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input
                value={formData.state}
                onChange={e => setFormData({ ...formData, state: e.target.value })}
                className={inputCls}
                placeholder="Maharashtra"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Gender</label>
              <select
                value={formData.gender}
                onChange={e => setFormData({ ...formData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
                className={inputCls + ' bg-white cursor-pointer'}
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Preferred Category</label>
              <select
                value={formData.preferredCategory}
                onChange={e => setFormData({ ...formData, preferredCategory: e.target.value })}
                className={inputCls + ' bg-white cursor-pointer'}
              >
                {['Electronics', 'Clothing', 'Shoes', 'Beauty', 'Home & Kitchen', 'Sports', 'Accessories', 'Books'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button
            onClick={() => mutation.mutate(formData)}
            disabled={mutation.isPending || !formData.firstName || !formData.email}
            className="btn-primary"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isEditing ? 'Save Changes' : 'Create Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}
