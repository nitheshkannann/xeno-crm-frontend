import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Play, Loader2, Bot, ChevronRight, X } from 'lucide-react';
import { api } from '../lib/api';
import { formatDate, formatNumber, formatPercent, getCampaignStatusClass } from '../lib/utils';
import type { ApiResponse, Campaign, Segment } from '@xeno/types';
import { Link } from 'react-router-dom';

const STEP_LABELS = ['Setup', 'AI Message', 'Review'];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEP_LABELS.map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
            current > i + 1
              ? 'bg-green-600 text-white'
              : current === i + 1
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-400'
          }`}>
            {i + 1}
          </div>
          <span className={`text-xs font-medium ${current === i + 1 ? 'text-gray-900' : 'text-gray-400'}`}>
            {s}
          </span>
          {i < STEP_LABELS.length - 1 && (
            <div className={`w-6 h-px ${current > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function CampaignsPage() {
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [channel, setChannel] = useState('EMAIL');
  const [name, setName] = useState('');
  const [objective, setObjective] = useState('');
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variants, setVariants] = useState<{ label: string; angle: string; subject?: string; body: string; targetProfile: string }[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => api.get<ApiResponse<Campaign[]>>('/campaigns').then(r => r.data),
    refetchInterval: 5000,
  });

  const { data: segments } = useQuery({
    queryKey: ['segments'],
    queryFn: () => api.get<ApiResponse<Segment[]>>('/segments').then(r => r.data),
  });

  const { data: campaignDetail } = useQuery({
    queryKey: ['campaign', selectedCampaign],
    queryFn: () => selectedCampaign ? api.get<ApiResponse<Campaign>>(`/campaigns/${selectedCampaign}`).then(r => r.data) : null,
    enabled: !!selectedCampaign,
    refetchInterval: selectedCampaign ? 3000 : false,
  });

  const launchMutation = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/launch`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post('/campaigns', data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['campaigns'] }); setShowCreate(false); resetForm(); },
  });

  const resetForm = () => { setStep(1); setSelectedSegment(''); setChannel('EMAIL'); setName(''); setObjective(''); setVariants([]); };

  const generateVariants = async () => {
    setVariantsLoading(true);
    try {
      const res = await api.post<ApiResponse<{ variants: typeof variants }>>('/ai/write-campaign', {
        objective, channel, segmentId: selectedSegment,
      });
      setVariants(res.data.variants);
      setStep(3);
    } catch (err: any) {
      alert(err.message || 'Failed to generate variants. Please check your AI API key limit or try again.');
    } finally {
      setVariantsLoading(false);
    }
  };

  const stats = campaignDetail?.stats;

  const STATUS_DOT: Record<string, string> = {
    RUNNING: 'bg-green-500',
    COMPLETED: 'bg-blue-500',
    DRAFT: 'bg-gray-300',
    FAILED: 'bg-red-500',
    SCHEDULED: 'bg-amber-500',
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Campaigns</h1>
          <p className="page-subtitle">Create, launch, and track your marketing campaigns</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/ai-agent" id="btn-ai-campaign" className="btn-ghost">
            <Bot className="w-4 h-4 text-violet-600" />
            AI Agent
          </Link>
          <button id="btn-create-campaign" onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            New Campaign
          </button>
        </div>
      </div>

      <div className="flex gap-5 items-start">
        {/* Campaign list */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="card p-4 h-16 shimmer" />
              ))}
            </div>
          ) : (
            <div className="table-container">
              {campaigns?.length === 0 && (
                <div className="px-4 py-12 text-center text-sm text-gray-400">
                  No campaigns yet. Create your first campaign above.
                </div>
              )}
              {campaigns?.map((campaign, idx) => (
                <div
                  key={campaign.id}
                  onClick={() => setSelectedCampaign(campaign.id)}
                  className={`px-4 py-4 cursor-pointer transition-colors ${
                    idx < (campaigns?.length || 0) - 1 ? 'border-b border-gray-100' : ''
                  } ${selectedCampaign === campaign.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[campaign.status] || 'bg-gray-300'} ${campaign.status === 'RUNNING' ? 'animate-pulse' : ''}`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm text-gray-900 truncate">{campaign.name}</p>
                          {campaign.isAutoGenerated && (
                            <span className="ai-badge flex-shrink-0">AI</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-gray-400">{campaign.segment?.name}</span>
                          <span className="text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{campaign.channel}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={getCampaignStatusClass(campaign.status)}>{campaign.status}</span>
                      {campaign.status === 'DRAFT' && (
                        <button
                          onClick={e => { e.stopPropagation(); launchMutation.mutate(campaign.id); }}
                          disabled={launchMutation.isPending}
                          className="btn-primary py-1 px-3 text-xs"
                        >
                          <Play className="w-3 h-3" />
                          Launch
                        </button>
                      )}
                    </div>
                  </div>
                  {campaign.stats && (
                    <div className="grid grid-cols-4 gap-4 mt-3 pt-3 border-t border-gray-100">
                      {[
                        { label: 'Sent', value: formatNumber(campaign.stats.total) },
                        { label: 'Delivered', value: formatPercent(campaign.stats.deliveryRate) },
                        { label: 'Opened', value: formatPercent(campaign.stats.openRate) },
                        { label: 'Converted', value: formatPercent(campaign.stats.conversionRate) },
                      ].map(s => (
                        <div key={s.label}>
                          <p className="text-[11px] text-gray-400">{s.label}</p>
                          <p className="text-sm font-semibold text-gray-900">{s.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Campaign Detail Panel */}
        {campaignDetail && (
          <div className="w-72 flex-shrink-0 animate-fade-in">
            <div className="card p-5 sticky top-0">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 truncate">{campaignDetail.name}</h3>
                  <span className={`${getCampaignStatusClass(campaignDetail.status)} mt-1 inline-block`}>
                    {campaignDetail.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="p-1 text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Delivery Funnel */}
              {stats && stats.total > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-xs font-medium text-gray-500">Delivery Funnel</p>
                  {[
                    { label: 'Total', count: stats.total, color: '#94A3B8', pct: 1 },
                    { label: 'Delivered', count: stats.delivered, color: '#2563EB', pct: stats.deliveryRate },
                    { label: 'Opened', count: stats.opened, color: '#7C3AED', pct: stats.openRate },
                    { label: 'Clicked', count: stats.clicked, color: '#16A34A', pct: stats.clickRate },
                    { label: 'Converted', count: stats.converted, color: '#D97706', pct: stats.conversionRate },
                  ].map(f => (
                    <div key={f.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-500">{f.label}</span>
                        <span className="font-medium text-gray-700 tabular-nums">
                          {f.count}{f.pct < 1 ? ` (${formatPercent(f.pct)})` : ''}
                        </span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${f.pct * 100}%`, backgroundColor: f.color, transition: 'width 0.5s ease' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Variants */}
              {campaignDetail.variants && campaignDetail.variants.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Message Variants</p>
                  {campaignDetail.variants.map(v => (
                    <div key={v.id} className="text-xs p-3 rounded-md bg-gray-50 border border-gray-100 mb-2">
                      <p className="font-semibold text-blue-700 mb-1">{v.label}</p>
                      <p className="text-gray-500 line-clamp-2">{v.body}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && setShowCreate(false)}
        >
          <div className="bg-white rounded-xl border border-gray-200 shadow-lg w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">New Campaign</h2>
              <button onClick={() => { setShowCreate(false); resetForm(); }} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-5 pb-2">
              <StepIndicator current={step} />
            </div>

            <div className="px-6 pb-6 space-y-4">
              {step === 1 && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Campaign name</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Summer Re-engagement"
                      className="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Target segment</label>
                    <select
                      value={selectedSegment}
                      onChange={e => setSelectedSegment(e.target.value)}
                      className="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      <option value="">Select a segment…</option>
                      {segments?.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({formatNumber(s.customerCount)} customers)</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Channel</label>
                    <select
                      value={channel}
                      onChange={e => setChannel(e.target.value)}
                      className="w-full h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                    >
                      {['EMAIL', 'SMS', 'WHATSAPP', 'PUSH'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!name || !selectedSegment}
                    className="btn-primary w-full"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {step === 2 && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1.5">Campaign objective</label>
                    <textarea
                      value={objective}
                      onChange={e => setObjective(e.target.value)}
                      placeholder="e.g. Re-engage inactive customers and drive repeat purchases"
                      rows={3}
                      className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
                    />
                  </div>
                  <button
                    onClick={generateVariants}
                    disabled={!objective || variantsLoading}
                    className="btn-primary w-full"
                  >
                    {variantsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bot className="w-4 h-4" />}
                    {variantsLoading ? 'Generating variants…' : 'Generate 4 AI variants'}
                  </button>
                  <button onClick={() => setStep(1)} className="btn-ghost w-full">Back</button>
                </>
              )}

              {step === 3 && (
                <>
                  <p className="text-xs font-medium text-gray-600">{variants.length} message variants generated</p>
                  <div className="space-y-2 max-h-56 overflow-y-auto custom-scrollbar">
                    {variants.map((v, i) => (
                      <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                        <p className="text-xs font-semibold text-blue-700 mb-1">{v.label} — {v.angle}</p>
                        {v.subject && <p className="text-xs font-medium text-gray-700 mb-1">{v.subject}</p>}
                        <p className="text-xs text-gray-500 line-clamp-3">{v.body}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => createMutation.mutate({ name, segmentId: selectedSegment, channel, variants })}
                      disabled={createMutation.isPending}
                      className="btn-primary flex-1"
                    >
                      {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save as Draft
                    </button>
                    <button onClick={() => setStep(2)} className="btn-ghost">Back</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
