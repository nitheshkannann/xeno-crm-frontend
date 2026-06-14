import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot, Loader2, CheckCircle, Circle, AlertCircle,
  Zap, Sparkles, Info, Radio,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { formatNumber, formatPercent } from '../lib/utils';
import type { AIAgentStep, AIAgentResult, AICampaignVariant, AIExplainability } from '@xeno/types';

const SUGGESTED_GOALS = [
  'Increase repeat purchases from inactive customers',
  'Win back high-value customers who haven\'t ordered in 60 days',
  'Boost sales among at-risk shoe buyers in Chennai',
  'Re-engage loyal customers with new arrivals',
  'Prevent churn among VIP customers',
];

function StepIcon({ status }: { status: string }) {
  if (status === 'done') return <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />;
  if (status === 'running') return <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />;
  if (status === 'error') return <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
  return <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />;
}

function ExplainabilityPanel({ explain }: { explain: AIExplainability }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          <h4 className="text-sm font-semibold text-gray-900">Why AI Recommended This</h4>
        </div>
        <span className="text-xs text-gray-500">
          Confidence:{' '}
          <span className="font-semibold text-blue-700">{Math.round((explain.confidence || 0) * 100)}%</span>
        </span>
      </div>
      <p className="text-sm text-gray-500 mb-3 italic leading-relaxed">"{explain.recommendation}"</p>
      <div className="space-y-2">
        {explain.reasoning?.map((reason, i) => (
          <div key={i} className="flex items-start gap-2.5 text-sm">
            <div className="w-1 h-1 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
            <span className="text-gray-600">{reason}</span>
          </div>
        ))}
      </div>
          {explain.alternatives && explain.alternatives.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-500 mb-2">Alternatives considered</p>
          {explain.alternatives.map((alt: { segment: string; reason: string }, i: number) => (
            <div key={i} className="text-xs text-gray-500 flex items-start gap-2 mb-1">
              <span className="text-red-400 font-bold mt-0.5">✗</span>
              <span>
                <span className="font-medium text-gray-700">{alt.segment}</span> — {alt.reason}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VariantCard({ variant, index }: { variant: AICampaignVariant; index: number }) {
  const borderColors = [
    'border-l-blue-500',
    'border-l-green-500',
    'border-l-amber-500',
    'border-l-violet-500',
  ];
  return (
    <div className={`bg-white border border-gray-200 border-l-4 ${borderColors[index % 4]} rounded-lg p-4`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{variant.label}</span>
        <span className="text-gray-300">·</span>
        <span className="text-xs text-gray-400">{variant.angle}</span>
      </div>
      {variant.subject && (
        <p className="text-sm font-semibold text-gray-900 mb-1">📧 {variant.subject}</p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">{variant.body}</p>
    </div>
  );
}

export function AIAgentPage() {
  const [searchParams] = useSearchParams();
  const [goal, setGoal] = useState(searchParams.get('goal') || '');
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AIAgentStep[]>([]);
  const [result, setResult] = useState<AIAgentResult | null>(null);
  const [approving, setApproving] = useState(false);
  const [approved, setApproved] = useState(false);
  const [error, setError] = useState('');
  const token = useAuthStore(s => s.token);
  const stepsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stepsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [steps]);

  useEffect(() => {
    if (searchParams.get('goal') && !isRunning && steps.length === 0) {
      void runAgent();
    }
  }, []);

  const runAgent = async () => {
    if (!goal.trim() || isRunning) return;
    setIsRunning(true);
    setSteps([]);
    setResult(null);
    setError('');
    setApproved(false);

    const encodedGoal = encodeURIComponent(goal);
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const url = `${baseUrl}/api/ai/run-agent?goal=${encodedGoal}`;
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
      const response = await fetch(url, { headers });
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No stream');

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.type === 'step') {
                setSteps(prev => {
                  const existing = prev.findIndex(s => s.step === data.step.step);
                  if (existing >= 0) {
                    const updated = [...prev];
                    updated[existing] = data.step;
                    return updated;
                  }
                  return [...prev, data.step];
                });
              } else if (data.type === 'complete') {
                setResult(data.result);
              } else if (data.type === 'error') {
                setError(data.message);
              }
            } catch { }
          }
        }
      }
    } catch (err) {
      setError((err as Error).message || 'Agent failed');
    } finally {
      setIsRunning(false);
    }
  };

  const handleApprove = async () => {
    if (!result?.campaignDraft) return;
    setApproving(true);
    try {
      const draft = result.campaignDraft as unknown as Record<string, unknown>;
      await api.post('/ai/approve-agent', {
        segmentName: draft.segmentName,
        segmentDescription: draft.description,
        filterRules: draft.filterRules,
        campaignName: draft.name,
        channel: draft.channel,
        variants: draft.variants,
      });
      setApproved(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setApproving(false);
    }
  };

  const draft = result?.campaignDraft as unknown as Record<string, unknown> | undefined;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="page-title">AI Campaign Agent</h1>
            <span className="ai-badge">Xeno</span>
          </div>
          <p className="page-subtitle">
            Describe your marketing goal — the AI will analyze customers, build a segment, write messages, and prepare a campaign.
          </p>
        </div>
      </div>

      {/* Goal input */}
      <div className="card p-5">
        <label className="text-xs font-medium text-gray-600 block mb-2">Marketing goal</label>
        <div className="flex gap-3">
          <input
            id="input-agent-goal"
            value={goal}
            onChange={e => setGoal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && runAgent()}
            placeholder="e.g. Increase repeat purchases from inactive customers…"
            className="flex-1 h-10 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            disabled={isRunning}
          />
          <button
            id="btn-run-agent"
            onClick={runAgent}
            disabled={isRunning || !goal.trim()}
            className="btn-primary px-5"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isRunning ? 'Running…' : 'Run Agent'}
          </button>
        </div>

        {/* Suggestions */}
        {!isRunning && steps.length === 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-2">Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_GOALS.map(g => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className="text-xs bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-full transition-colors"
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Agent Steps */}
      <AnimatePresence>
        {steps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Radio className={`w-4 h-4 ${isRunning ? 'text-blue-600 animate-pulse' : 'text-green-600'}`} />
              <h3 className="text-sm font-semibold text-gray-900">
                {isRunning ? 'Agent working…' : 'Agent complete'}
              </h3>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={step.step + i} className="flex items-start gap-3">
                  <StepIcon status={step.status} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      step.status === 'done'
                        ? 'text-gray-900'
                        : step.status === 'running'
                          ? 'text-blue-700 font-medium'
                          : 'text-gray-400'
                    }`}>
                      {step.message}
                    </p>
                    {(step.data && step.step === 'segment' && !!(step.data as { count?: number }).count) ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Matched {formatNumber((step.data as { count: number }).count)} customers
                      </p>
                    ) : null}
                  </div>
                </div>
              ))}
              <div ref={stepsEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="card p-4 border-l-4 border-l-red-500 bg-red-50">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      <AnimatePresence>
        {result && !approved && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Explainability */}
            {result.explainability && <ExplainabilityPanel explain={result.explainability} />}

            {/* Campaign Draft */}
            {draft && (
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-green-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Campaign Draft Ready</h3>
                  </div>
                  <span className="badge-neutral">Awaiting Approval</span>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: 'Campaign Name', value: String(draft.name || '') },
                    { label: 'Channel', value: String(draft.channel || '') },
                    { label: 'Audience', value: `${formatNumber((draft.segment as { customerCount: number })?.customerCount || 0)} customers` },
                  ].map(item => (
                    <div key={item.label} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <p className="text-xs text-gray-400 mb-1">{item.label}</p>
                      <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Variants */}
                <div className="space-y-3 mb-5">
                  <p className="text-xs font-medium text-gray-500">Message Variants (AI Generated)</p>
                  {(draft.variants as AICampaignVariant[])?.map((v, i) => (
                    <VariantCard key={i} variant={v} index={i} />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    id="btn-approve-campaign"
                    onClick={handleApprove}
                    disabled={approving}
                    className="btn-primary"
                  >
                    {approving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {approving ? 'Launching…' : 'Approve & Launch'}
                  </button>
                  <button
                    id="btn-reject-campaign"
                    onClick={() => { setResult(null); setSteps([]); setGoal(''); }}
                    className="btn-ghost"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Approved */}
      <AnimatePresence>
        {approved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-8 text-center border-l-4 border-l-green-500"
          >
            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Campaign Launched!</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Your AI-generated campaign is now running. Messages are being dispatched. Check the Campaigns page for live stats.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <a href="/campaigns" className="btn-primary">View Campaign</a>
              <button
                onClick={() => { setResult(null); setSteps([]); setGoal(''); setApproved(false); }}
                className="btn-ghost"
              >
                New Campaign
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
