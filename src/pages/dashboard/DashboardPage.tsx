import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { dashboardApi, coldCallingApi } from '../../api/endpoints';
import { DashboardDto } from '../../types/api';
import {
  Users,
  KanbanSquare,
  Clock,
  TrendingUp,
  AlertCircle,
  PhoneCall,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { toast } from '../../utils/errors';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#f59e0b', '#10b981', '#ef4444'];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showQuickCall, setShowQuickCall] = useState(false);
  const [quickCallForm, setQuickCallForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    outcome: 'INTERESTED' as any,
    notes: '',
  });

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardApi.getDashboard();
      setData(res);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [user]);

  const handleCreateQuickCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coldCallingApi.createColdCall(quickCallForm);
      setShowQuickCall(false);
      setQuickCallForm({ companyName: '', contactPerson: '', phone: '', outcome: 'INTERESTED', notes: '' });
      loadDashboard();
    } catch {
      // handled
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isStaff = user?.role === 'STAFF';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            Welcome back, {user?.fullName}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {isStaff
              ? 'Here is your daily operational summary and active portfolio metrics.'
              : 'Enterprise overview: Corporate pipeline, department performance, and approvals.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowQuickCall(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Quick Log Call</span>
          </button>
          <button
            onClick={() => navigate('/leads')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {isStaff ? (
        /* Staff Perspective */
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>My Active Leads</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{data.metrics.myLeads}</div>
            <div className="text-[11px] text-teal-600 mt-1 flex items-center gap-0.5">
              <span>Assigned in scope</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Calls Logged Today</span>
              <PhoneCall className="w-4 h-4 text-sky-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{data.metrics.myCallsToday}</div>
            <div className="text-[11px] text-slate-500 mt-1">Daily target: 20 calls</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>Pending Approvals</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{data.metrics.myPendingApprovals}</div>
            <div className="text-[11px] text-amber-600 mt-1">Awaiting manager sign-off</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
              <span>My Expenses</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{data.metrics.myExpenses}</div>
            <div className="text-[11px] text-slate-500 mt-1">Claims submitted</div>
          </div>
        </div>
      ) : (
        /* Executive / Manager Perspective */
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-medium">Total Pipeline Value</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ₹{(data.metrics.pipelineValue / 100000).toFixed(1)} Lakhs
            </div>
            <div className="text-[11px] text-teal-600 font-medium mt-1">{data.metrics.liveLeads} Live Deals</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-medium">Closed / Won Deals</div>
            <div className="text-xl font-bold text-emerald-600 mt-1">{data.metrics.closedDeals} Deals</div>
            <div className="text-[11px] text-slate-500 mt-1">Completed Step 7</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-medium">Pending Approvals</div>
            <div className="text-xl font-bold text-amber-600 mt-1">{data.metrics.pendingApprovals} Deals</div>
            <div className="text-[11px] text-amber-600 mt-1">Requires Sign-off</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-medium">MTD Collected Revenue</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              ₹{(data.metrics.mtdRevenue / 100000).toFixed(1)} Lakhs
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Target: ₹25 Lakhs</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-medium">Total Outstanding</div>
            <div className="text-xl font-bold text-red-600 mt-1">
              ₹{(data.metrics.totalOutstanding / 100000).toFixed(1)} Lakhs
            </div>
            <div className="text-[11px] text-red-600 mt-1">Unpaid Invoices</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="text-slate-500 text-xs font-medium">Staff Present Today</div>
            <div className="text-xl font-bold text-slate-900 mt-1">
              {data.metrics.staffCheckedIn} Staff
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-1">
              {data.metrics.activeFieldVisits} Active Field Visits
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Stage Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              Pipeline Stage Breakdown
            </h2>
            <span className="text-xs text-slate-500">Live Deals Status</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.leadStatusDistribution}>
                <XAxis dataKey="stage" tick={{ fontSize: 10 }} tickFormatter={(v) => v.replace('L', 'Stage ')} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#0d9488" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Sources Pie */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Source Distribution</h2>
            <span className="text-xs text-slate-500">Lead Origin</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.sourceWiseLeads}
                  dataKey="count"
                  nameKey="source"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ source, percent }) => `${source.replace('_', ' ')}: ${(percent * 100).toFixed(0)}%`}
                >
                  {data.sourceWiseLeads.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Revenue Trend & Stuck Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Revenue Trend (FY 2025-26)</h2>
            <span className="text-xs text-slate-500">Monthly in ₹</span>
          </div>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyRevenueTrend}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${val / 100000}L`} />
                <Tooltip formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stuck Leads Widget (>14 days inactive) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-slate-800 tracking-tight">
                Stuck Leads Alert ({data.stuckLeads.length})
              </h2>
            </div>
            <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
              &gt;14 days without activity
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
            {data.stuckLeads.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Great job! No leads are currently inactive past 14 days.
              </div>
            ) : (
              data.stuckLeads.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{l.companyName}</p>
                    <p className="text-[11px] text-slate-500">
                      {l.leadCode} • Owner: {l.ownerName} • Stage: {l.stage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-slate-900">
                      ₹{l.expectedValue.toLocaleString('en-IN')}
                    </p>
                    <button
                      onClick={() => navigate(`/leads/${l.id}`)}
                      className="text-[11px] font-medium text-teal-600 hover:text-teal-800 flex items-center gap-0.5 ml-auto"
                    >
                      <span>Take Action</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Log Call Modal */}
      {showQuickCall && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-800">Quick Log Cold Call</h3>
              <button
                onClick={() => setShowQuickCall(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuickCall} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Name</label>
                <input
                  required
                  value={quickCallForm.companyName}
                  onChange={(e) => setQuickCallForm({ ...quickCallForm, companyName: e.target.value })}
                  placeholder="e.g. Infosys Pune"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Person</label>
                <input
                  required
                  value={quickCallForm.contactPerson}
                  onChange={(e) => setQuickCallForm({ ...quickCallForm, contactPerson: e.target.value })}
                  placeholder="e.g. Rajesh Patil"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                <input
                  required
                  value={quickCallForm.phone}
                  onChange={(e) => setQuickCallForm({ ...quickCallForm, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Outcome</label>
                <select
                  value={quickCallForm.outcome}
                  onChange={(e) => setQuickCallForm({ ...quickCallForm, outcome: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                >
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="CALLBACK_REQUESTED">CALLBACK_REQUESTED</option>
                  <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                  <option value="WRONG_NUMBER">WRONG_NUMBER</option>
                  <option value="NO_ANSWER">NO_ANSWER</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Call Notes</label>
                <textarea
                  rows={3}
                  value={quickCallForm.notes}
                  onChange={(e) => setQuickCallForm({ ...quickCallForm, notes: e.target.value })}
                  placeholder="Discussion remarks and requirements..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickCall(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Save Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
