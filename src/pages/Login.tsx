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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#000000' }}>
      <div className="w-full max-w-[400px]">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 hover:scale-105 transition-transform duration-200"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2), 0 4px 15px rgba(0, 245, 212, 0.15)'
            }}
          >
            <svg className="w-8 h-8" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logo-g1-login" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00F5D4" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="logo-g2-login" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
              </defs>
              <path
                d="M25 25 L48 50 L25 75"
                stroke="url(#logo-g1-login)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M75 25 L52 50 L75 75"
                stroke="url(#logo-g2-login)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="50" cy="50" r="8" fill="#FFFFFF" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>XENO CRM</h1>
          <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.75)' }}>AI-Native Marketing Platform</p>
        </div>

        {/* Card */}
        <div 
          className="rounded-2xl p-8" 
          style={{ 
            background: 'rgba(18, 18, 22, 0.65)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)' 
          }}
        >
          <h2 className="text-lg font-semibold text-white mb-6">Sign in to your workspace</h2>

          {/* Demo hint */}
          <div className="mb-5 px-3 py-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-xs font-semibold text-blue-300">Demo credentials pre-filled</p>
            <p className="text-xs text-blue-200 mt-0.5">admin@xeno.com · admin123</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-300 mb-1.5 block">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="input-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full h-9 bg-white/5 border border-white/10 rounded-md pl-9 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-300 mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  id="input-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full h-9 bg-white/5 border border-white/10 rounded-md pl-9 pr-3 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-400">{error}</p>
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
