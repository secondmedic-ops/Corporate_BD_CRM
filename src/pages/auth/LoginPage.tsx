import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api/mock/adapter';
import { HeartPulse, ShieldAlert, ArrowRight, CheckCircle, UserCheck } from 'lucide-react';
import { ToastContainer } from '../../components/common/ToastContainer';

export const LoginPage: React.FC = () => {
  const { login, switchUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('ravi@secondmedic.com');
  const [password, setPassword] = useState('SuperAdmin@2025');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setLoading(true);
    try {
      await switchUser(userEmail);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Switch failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 selection:bg-teal-500 selection:text-white">
      <div className="w-full max-w-md space-y-6">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-emerald-500 shadow-xl shadow-teal-900/40 mb-2">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">SecondMedic BD CRM</h1>
          <p className="text-xs text-slate-400">Enterprise Corporate Health & Pipeline Management</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5">
          {error && (
            <div className="p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@secondmedic.com"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-teal-900/30 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In to Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Personas */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Instant Demo Personas
            </div>
            <div className="grid grid-cols-1 gap-2">
              {db.users.slice(0, 4).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 text-left transition-all group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-teal-400 group-hover:bg-teal-900">
                      {u.fullName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-200 group-hover:text-teal-300 truncate">
                        {u.fullName}
                      </p>
                      <p className="text-[10px] text-slate-400">{u.role.replace('_', ' ')} • {u.department || 'Executive'}</p>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500">
          Enforcing Scope-based access & Sequential Workflow controls
        </p>
      </div>
      <ToastContainer />
    </div>
  );
};
