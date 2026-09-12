import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { coldCallingApi } from '../../api/endpoints';
import { ColdCallDto } from '../../types/api';
import { PhoneCall, Plus, ArrowRight, CheckCircle2, Calendar, Phone, Sparkles } from 'lucide-react';
import { toast } from '../../utils/errors';

export const ColdCallingPage: React.FC = () => {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<ColdCallDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    outcome: 'INTERESTED' as any,
    notes: '',
    nextAction: 'Send corporate brochure',
    nextActionDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  });

  const loadCalls = async () => {
    setLoading(true);
    try {
      const data = await coldCallingApi.getColdCalls();
      setCalls(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await coldCallingApi.createColdCall(form);
      setShowModal(false);
      setForm({
        companyName: '',
        contactPerson: '',
        phone: '',
        outcome: 'INTERESTED',
        notes: '',
        nextAction: 'Send corporate brochure',
        nextActionDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      });
      loadCalls();
    } catch {
      // handled
    }
  };

  const handleConvert = async (callId: string) => {
    try {
      const lead = await coldCallingApi.convert(callId);
      toast.success(`Converted to Lead ${lead.leadCode}!`);
      navigate(`/leads/${lead.id}`);
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-teal-600" /> Cold Calling & Lead Conversion
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log outbound prospecting activities, schedule follow-ups, and convert qualified prospects directly to corporate leads.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Log Outbound Call</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Company / Contact</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Outcome</th>
              <th className="px-4 py-3">Follow-up</th>
              <th className="px-4 py-3">Caller</th>
              <th className="px-4 py-3">Notes</th>
              <th className="px-5 py-3 text-right">Conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {calls.map((call) => (
              <tr key={call.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{call.companyName}</p>
                  <p className="text-[11px] text-slate-500">{call.contactPerson}</p>
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{call.phone}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      call.outcome === 'INTERESTED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : call.outcome === 'CALLBACK_REQUESTED'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {call.outcome.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-slate-800 font-medium">{call.nextAction}</p>
                  <p className="text-[10px] text-slate-400">{call.nextActionDate}</p>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{call.staffName}</td>
                <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">{call.notes}</td>
                <td className="px-5 py-3.5 text-right">
                  {call.convertedLeadId ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Converted
                    </span>
                  ) : (
                    <button
                      onClick={() => handleConvert(call.id)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg border border-teal-200 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Convert to Lead</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">Log Outbound Prospecting Call</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Name *</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Contact Person *</label>
                <input
                  required
                  value={form.contactPerson}
                  onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone *</label>
                <input
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Call Outcome</label>
                <select
                  value={form.outcome}
                  onChange={(e) => setForm({ ...form, outcome: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="INTERESTED">INTERESTED</option>
                  <option value="CALLBACK_REQUESTED">CALLBACK_REQUESTED</option>
                  <option value="NOT_INTERESTED">NOT_INTERESTED</option>
                  <option value="WRONG_NUMBER">WRONG_NUMBER</option>
                  <option value="NO_ANSWER">NO_ANSWER</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Next Action</label>
                <input
                  value={form.nextAction}
                  onChange={(e) => setForm({ ...form, nextAction: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Next Action Date</label>
                <input
                  type="date"
                  value={form.nextActionDate}
                  onChange={(e) => setForm({ ...form, nextActionDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Call Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Record Call
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
