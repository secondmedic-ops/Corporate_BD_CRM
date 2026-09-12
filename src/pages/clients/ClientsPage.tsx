import React, { useState, useEffect } from 'react';
import { clientsApi } from '../../api/endpoints';
import { ClientDto } from '../../types/api';
import { Building2, Plus, Phone, Mail, MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<ClientDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    clientName: '',
    contactPerson: '',
    phone: '',
    email: '',
    addressLine: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400051',
    gstin: '27AABCU9603R1ZM',
    agreementStartDate: new Date().toISOString().split('T')[0],
    agreementEndDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await clientsApi.getClients();
      setClients(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clientsApi.createClient(form);
      setShowModal(false);
      load();
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-600" /> Corporate Clients Master
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active corporate accounts, agreement coverage periods, GSTIN compliance, and renewal status.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Onboard Client</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Client Code / Name</th>
              <th className="px-4 py-3">Primary Contact</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">GSTIN / PAN</th>
              <th className="px-4 py-3">Agreement Validity</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{c.clientName}</p>
                  <p className="text-[11px] font-mono text-teal-600">{c.clientCode}</p>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-slate-800 font-medium">{c.contactPerson}</p>
                  <p className="text-[11px] text-slate-400">{c.phone}</p>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{c.city}, {c.state}</td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{c.gstin || 'N/A'}</td>
                <td className="px-4 py-3.5">
                  <span className="text-slate-700">
                    {c.agreementStartDate} to {c.agreementEndDate}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">Onboard Corporate Client</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Legal Name *</label>
                <input
                  required
                  value={form.clientName}
                  onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">City</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">GSTIN</label>
                  <input
                    value={form.gstin}
                    onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
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
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
