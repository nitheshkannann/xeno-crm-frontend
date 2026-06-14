import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Plus, Target, Users, Bot, Loader2, Trash2, RefreshCw, Zap, X } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate, formatNumber } from '../lib/utils';
import type { ApiResponse, Segment, FilterGroup, FilterRule, SegmentPreview } from '@xeno/types';

const FIELD_OPTIONS = [
  { value: 'daysSinceLastOrder', label: 'Days Since Last Order', type: 'number' },
  { value: 'totalSpend', label: 'Total Spend (₹)', type: 'number' },
  { value: 'orderCount', label: 'Order Count', type: 'number' },
  { value: 'avgOrderValue', label: 'Avg Order Value (₹)', type: 'number' },
  { value: 'healthScore', label: 'Health Score (0-100)', type: 'number' },
  { value: 'healthLabel', label: 'Health Label', type: 'enum', options: ['HIGHLY_LOYAL', 'ACTIVE', 'AT_RISK', 'CHURN_RISK'] },
  { value: 'emailOpenRate', label: 'Email Open Rate', type: 'number' },
  { value: 'city', label: 'City', type: 'string' },
  { value: 'gender', label: 'Gender', type: 'enum', options: ['MALE', 'FEMALE', 'OTHER'] },
  { value: 'preferredCategory', label: 'Preferred Category', type: 'enum', options: ['Shoes', 'Clothing', 'Electronics', 'Books', 'Home & Kitchen', 'Beauty', 'Sports', 'Accessories'] },
];

const OPERATORS_BY_TYPE: Record<string, { value: string; label: string }[]> = {
  number: [
    { value: 'gt', label: '>' }, { value: 'gte', label: '>=' },
    { value: 'lt', label: '<' }, { value: 'lte', label: '<=' }, { value: 'eq', label: '=' },
  ],
  string: [{ value: 'eq', label: '=' }, { value: 'contains', label: 'contains' }, { value: 'neq', label: '≠' }],
  enum: [{ value: 'eq', label: '=' }, { value: 'neq', label: '≠' }, { value: 'in', label: 'in' }],
};

function RuleRow({ rule, onChange, onRemove }: {
  rule: FilterRule; onChange: (r: FilterRule) => void; onRemove: () => void;
}) {
  const field = FIELD_OPTIONS.find(f => f.value === rule.field);
  const operators = OPERATORS_BY_TYPE[field?.type || 'string'];
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
      <select
        value={rule.field}
        onChange={e => onChange({ ...rule, field: e.target.value, operator: 'eq', value: '' })}
        className="flex-1 h-8 border border-gray-200 rounded px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
      >
        {FIELD_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
      </select>
      <select
        value={rule.operator}
        onChange={e => onChange({ ...rule, operator: e.target.value as FilterRule['operator'] })}
        className="w-16 h-8 border border-gray-200 rounded px-2 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
      >
        {operators?.map(op => <option key={op.value} value={op.value}>{op.label}</option>)}
      </select>
      {field?.type === 'enum' ? (
        <select
          value={String(rule.value)}
          onChange={e => onChange({ ...rule, value: e.target.value })}
          className="flex-1 h-8 border border-gray-200 rounded px-2 text-xs bg-white focus:outline-none"
        >
          {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          value={String(rule.value)}
          onChange={e => onChange({ ...rule, value: e.target.value })}
          placeholder="value"
          className="flex-1 h-8 border border-gray-200 rounded px-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      )}
      <button
        onClick={onRemove}
        className="p-1 text-gray-400 hover:text-red-500 rounded transition-colors"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function SegmentsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [isAuto, setIsAuto] = useState(false);
  const [filterRules, setFilterRules] = useState<FilterGroup>({ logic: 'AND', rules: [] });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [preview, setPreview] = useState<SegmentPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const { data: segments, isLoading } = useQuery({
    queryKey: ['segments'],
    queryFn: () => api.get<ApiResponse<Segment[]>>('/segments').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/segments', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['segments'] }); setShowCreate(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/segments/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['segments'] }),
  });

  const computeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/segments/${id}/compute`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['segments'] }),
  });

  const resetForm = () => {
    setName(''); setDescription(''); setFilterRules({ logic: 'AND', rules: [] }); setPreview(null); setAiPrompt('');
  };

  const addRule = () => {
    setFilterRules(prev => ({
      ...prev,
      rules: [...prev.rules, { field: 'daysSinceLastOrder', operator: 'gt' as const, value: '30' }],
    }));
  };

  const updateRule = (idx: number, rule: FilterRule) => {
    setFilterRules(prev => {
      const rules = [...prev.rules];
      rules[idx] = rule;
      return { ...prev, rules };
    });
  };

  const removeRule = (idx: number) => {
    setFilterRules(prev => ({ ...prev, rules: prev.rules.filter((_, i) => i !== idx) }));
  };

  const getPreview = async () => {
    if (filterRules.rules.length === 0) return;
    setPreviewLoading(true);
    try {
      const res = await api.post<ApiResponse<SegmentPreview>>('/segments/preview', { filterRules });
      setPreview(res.data);
    } finally {
      setPreviewLoading(false);
    }
  };

  const runAIBuilder = async () => {
    if (!aiPrompt) return;
    setAiLoading(true);
    try {
      const res = await api.post<ApiResponse<{ filterRules: FilterGroup; segmentName: string; segmentDescription: string; explanation: string; previewCount: number; sample?: SegmentPreview['sample'] }>>('/ai/build-segment', { prompt: aiPrompt });
      setFilterRules(res.data.filterRules);
      setName(res.data.segmentName);
      setDescription(res.data.segmentDescription);
      setPreview({ count: res.data.previewCount, sample: (res.data.sample ?? []) as SegmentPreview['sample'] });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Segments</h1>
          <p className="page-subtitle">Build audience segments with filter rules or AI</p>
        </div>
        <button id="btn-create-segment" onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          New Segment
        </button>
      </div>

      {/* Segment grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card p-5 h-28 shimmer" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {segments?.map(seg => (
            <div key={seg.id} className="card-hover p-5 group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Target className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{seg.name}</h3>
                          {seg.isAutoScheduled && (
                        <span title="Auto-scheduled" className="inline-flex">
                          <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => computeMutation.mutate(seg.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Recompute"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(seg.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {seg.description && (
                <p className="text-xs text-gray-500 mb-3 line-clamp-1 pl-9">{seg.description}</p>
              )}

              <div className="flex items-center justify-between pl-9">
                <div className="flex items-center gap-1.5 text-sm">
                  <Users className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900">{formatNumber(seg.customerCount)}</span>
                  <span className="text-gray-400 text-xs">customers</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 border border-gray-200 text-gray-500 px-2 py-0.5 rounded">
                    {seg.preferredChannel}
                  </span>
                  {seg.lastComputedAt && (
                    <span className="text-xs text-gray-400">{formatDate(seg.lastComputedAt)}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Segment Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.97, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.97, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-2xl max-h-[90vh] flex flex-col"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-base font-semibold text-gray-900">Create Segment</h2>
                <button
                  onClick={() => { setShowCreate(false); resetForm(); }}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="px-6 py-5 space-y-5">

                  {/* AI Builder */}
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-800">AI Segment Builder</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        id="input-ai-segment-prompt"
                        value={aiPrompt}
                        onChange={e => setAiPrompt(e.target.value)}
                        placeholder="e.g. Customers inactive 30-60 days with spend over ₹5000"
                        className="flex-1 h-9 border border-blue-200 bg-white rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                      <button
                        id="btn-ai-build-segment"
                        onClick={runAIBuilder}
                        disabled={aiLoading || !aiPrompt}
                        className="btn-primary whitespace-nowrap"
                      >
                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                        {aiLoading ? 'Building…' : 'Build with AI'}
                      </button>
                    </div>
                  </div>

                  {/* Name & Description */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">Segment name</label>
                      <input
                        id="input-segment-name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="e.g. Inactive High-Value Customers"
                        className="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">Description (optional)</label>
                      <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="Brief description of this segment"
                        rows={2}
                        className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                      />
                    </div>
                  </div>

                  {/* Channel + Auto */}
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-xs font-medium text-gray-600 block mb-1.5">Preferred channel</label>
                      <select
                        value={channel}
                        onChange={e => setChannel(e.target.value)}
                        className="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      >
                        {['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'].map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <label className="flex items-center gap-2.5 cursor-pointer pb-1">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isAuto}
                        onClick={() => setIsAuto(!isAuto)}
                        className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${isAuto ? 'bg-blue-600' : 'bg-gray-200'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${isAuto ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-sm text-gray-600">Auto monthly</span>
                    </label>
                  </div>

                  {/* Filter Rules */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium text-gray-600">Filter Rules</label>
                      <select
                        value={filterRules.logic}
                        onChange={e => setFilterRules(prev => ({ ...prev, logic: e.target.value as 'AND' | 'OR' | 'NOT' }))}
                        className="h-7 border border-gray-200 rounded px-2 text-xs bg-white focus:outline-none"
                      >
                        {['AND', 'OR', 'NOT'].map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      {filterRules.rules.map((rule, idx) => (
                        <RuleRow
                          key={idx}
                          rule={rule as FilterRule}
                          onChange={r => updateRule(idx, r)}
                          onRemove={() => removeRule(idx)}
                        />
                      ))}
                    </div>
                    <button
                      onClick={addRule}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      Add rule
                    </button>
                  </div>

                  {/* Preview */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={getPreview}
                      disabled={filterRules.rules.length === 0 || previewLoading}
                      className="btn-ghost"
                    >
                      {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
                      Preview audience
                    </button>
                    {preview && (
                      <span className="text-sm font-semibold text-blue-600">
                        {formatNumber(preview.count)} customers match
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
                <button
                  id="btn-save-segment"
                  onClick={() => createMutation.mutate({ name, description, filterRules, preferredChannel: channel, isAutoScheduled: isAuto })}
                  disabled={!name || filterRules.rules.length === 0 || createMutation.isPending}
                  className="btn-primary"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Segment
                </button>
                <button onClick={() => { setShowCreate(false); resetForm(); }} className="btn-ghost">
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
