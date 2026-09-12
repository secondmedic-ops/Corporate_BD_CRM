import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsApi } from '../../api/endpoints';
import { LeadDto, PipelineStage, LeadSource } from '../../types/api';
import { usePermissions, Can, RestrictedFieldBadge } from '../../hooks/usePermissions';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  DollarSign,
  Building,
  Calendar,
  Layers,
  Phone,
} from 'lucide-react';
import { toast } from '../../utils/errors';

export const LeadsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, can, scope, rule } = usePermissions();
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Lead Form state
  const allowedSources = (rule('allowedLeadSources') as LeadSource[]) || [
    'COLD_CALL',
    'REFERRAL',
    'INBOUND',
    'EVENT',
    'EXISTING_CLIENT_UPSELL',
  ];

  const [form, setForm] = useState({
    companyName: '',
    source: allowedSources[0] || 'COLD_CALL',
    industry: 'Healthcare / Corporate',
    city: 'Mumbai',
    state: 'Maharashtra',
    contactPerson: '',
    designation: 'VP HR / Wellness Head',
    phone: '',
    email: '',
    expectedValue: 500000,
    expectedClosureDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    notes: '',
  });

  const loadLeads = async () => {
    setLoading(true);
    try {
      const data = await leadsApi.getLeads({
        search: search || undefined,
        stage: stageFilter !== 'ALL' ? stageFilter : undefined,
      });
      setLeads(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, [stageFilter, user]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLeads();
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newLead = await leadsApi.createLead(form);
      setShowCreateModal(false);
      navigate(`/leads/${newLead.id}`);
    } catch {
      // handled by AppError toast
    }
  };

  const getStageBadge = (stage: PipelineStage) => {
    const map: Record<PipelineStage, { label: string; style: string }> = {
      L1_LEAD_CAPTURE: { label: 'L1 Capture', style: 'bg-slate-100 text-slate-700' },
      L2_QUALIFIED: { label: 'L2 Qualified', style: 'bg-sky-50 text-sky-700 border-sky-200' },
      L3_RFQ_RAISED: { label: 'L3 RFQ Raised', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      L4_PROPOSAL: { label: 'L4 Proposal', style: 'bg-amber-50 text-amber-700 border-amber-200' },
      L5_WON: { label: 'L5 Won', style: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' },
      LOST: { label: 'Lost', style: 'bg-red-50 text-red-700 border-red-200' },
    };
    const s = map[stage] || { label: stage, style: 'bg-slate-100 text-slate-700' };
    return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${s.style}`}>
        {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" /> Corporate Leads & Deals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Scope: <span className="font-semibold text-teal-700">{scope('leads')}</span> • Manage corporate prospects through qualifying, RFQ pricing, and multi-step approvals.
          </p>
        </div>

        <Can module="leads" action="create">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Capture New Lead</span>
          </button>
        </Can>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search company, code, contact..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
          />
        </form>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-medium">Stage:</span>
          {['ALL', 'L1_LEAD_CAPTURE', 'L2_QUALIFIED', 'L3_RFQ_RAISED', 'L4_PROPOSAL', 'L5_WON', 'LOST'].map((stg) => (
            <button
              key={stg}
              onClick={() => setStageFilter(stg)}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
                stageFilter === stg
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {stg === 'ALL' ? 'All Stages' : stg.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Leads List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Lead Code / Company</th>
              <th className="px-4 py-3">Stage</th>
              <th className="px-4 py-3">Contact Person</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3 text-right">Expected Value</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  No leads found matching query or your active scope.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr
                  key={lead.id}
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="hover:bg-teal-50/30 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      {lead.companyName}
                    </p>
                    <p className="text-[11px] font-mono text-teal-600">{lead.leadCode}</p>
                  </td>
                  <td className="px-4 py-3.5">{getStageBadge(lead.stage)}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-700 font-medium">{lead.contactPerson}</p>
                    <p className="text-[11px] text-slate-400">{lead.phone}</p>
                  </td>
                  <td className="px-4 py-3.5 text-slate-500 text-[11px]">
                    {lead.source.replace('_', ' ')}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-slate-700 font-medium">{lead.ownerName}</span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                    ₹{lead.expectedValue.toLocaleString('en-IN')}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="inline-flex items-center gap-1 text-teal-600 font-semibold text-xs hover:text-teal-800">
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Lead Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-800">Capture Corporate Lead</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company / Organization *</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Reliance Retail Corporate"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Lead Source</label>
                  <select
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {allowedSources.map((src) => (
                      <option key={src} value={src}>
                        {src.replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Industry</label>
                  <input
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Contact Person *</label>
                  <input
                    required
                    value={form.contactPerson}
                    onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    placeholder="e.g. Sunita Deshmukh"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Designation</label>
                  <input
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    placeholder="Head of HR / CSR"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Phone *</label>
                  <input
                    required
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="9820011223"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="sunita@company.com"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    Expected Deal Value (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={form.expectedValue}
                    onChange={(e) => setForm({ ...form, expectedValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Expected Closure</label>
                  <input
                    type="date"
                    required
                    value={form.expectedClosureDate}
                    onChange={(e) => setForm({ ...form, expectedClosureDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Lead Notes / Requirements</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Employee health package requirements, headcount, etc."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Save Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
