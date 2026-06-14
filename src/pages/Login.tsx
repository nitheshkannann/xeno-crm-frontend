import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import type { ApiResponse, AuthResponse } from '@xeno/types';

export function LoginPage() {
  const [email, setEmail] = useState('admin@xeno.com');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useAuthStore(s => s.setAuth);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
      setAuth(res.data.token, res.data.user);
      navigate('/');
    } catch (err: unknown) {
      setError((err as Error).message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(130deg, #00C9B1 0%, #9B59B6 55%, #7c3aed 100%)' }}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #00C9B1, #3b82f6)', boxShadow: '0 8px 24px rgba(0,201,177,0.4)' }}>
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.15)' }}>XENO CRM</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>AI-Native Marketing Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Sign in to your workspace</h2>

          {/* Demo hint */}
          <div className="mb-5 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs font-medium text-blue-700">Demo credentials pre-filled</p>
            <p className="text-xs text-blue-600 mt-0.5">admin@xeno.com · admin123</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-9 border border-gray-200 rounded-md pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="input-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 border border-gray-200 rounded-md pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="btn-primary w-full h-9 mt-1"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Signing in…' : 'Sign in'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Powered by AI · XENO Platform
        </p>
      </div>
    </div>
  );
}
