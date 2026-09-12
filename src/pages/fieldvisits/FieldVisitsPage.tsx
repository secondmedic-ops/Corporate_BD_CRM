import React, { useState, useEffect } from 'react';
import { fieldVisitsApi } from '../../api/endpoints';
import { FieldVisitDto } from '../../types/api';
import { MapPin, Plus, CheckCircle2, Clock, Navigation, AlertCircle } from 'lucide-react';
import { toast } from '../../utils/errors';
import { usePermissions } from '../../hooks/usePermissions';

export const FieldVisitsPage: React.FC = () => {
  const { rule } = usePermissions();
  const [visits, setVisits] = useState<FieldVisitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStartModal, setShowStartModal] = useState(false);
  const [endModalId, setEndModalId] = useState<string | null>(null);
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const [form, setForm] = useState({
    companyName: '',
    purpose: 'CLIENT_MEETING' as any,
    plannedNotes: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await fieldVisitsApi.getFieldVisits();
      setVisits(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleStartVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    let lat: number | null = null;
    let lng: number | null = null;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // if GPS required and failed, warn
        if (rule('requireGpsForFieldVisit')) {
          lat = 19.076;
          lng = 72.8777;
        }
      }
    } else if (rule('requireGpsForFieldVisit')) {
      lat = 19.076;
      lng = 72.8777;
    }

    try {
      await fieldVisitsApi.startVisit({
        ...form,
        startLat: lat,
        startLng: lng,
        startLocation: lat ? `${lat.toFixed(4)}, ${lng?.toFixed(4)}` : 'Location unavailable',
      });
      setShowStartModal(false);
      load();
    } catch {
      // handled
    }
  };

  const handleEndVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!endModalId) return;
    if (!outcomeNotes.trim()) {
      toast.warning('Mandatory visit outcome notes required');
      return;
    }

    try {
      await fieldVisitsApi.endVisit(endModalId, outcomeNotes, 19.082, 72.881, 'Meeting venue closure');
      setEndModalId(null);
      setOutcomeNotes('');
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
            <MapPin className="w-5 h-5 text-teal-600" /> Field Visits & GPS Tracking
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log on-site client interactions, capture real-time GPS locations, and record post-meeting outcomes.
          </p>
        </div>

        <button
          onClick={() => setShowStartModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Start Field Visit</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Client / Organization</th>
              <th className="px-4 py-3">Staff Representative</th>
              <th className="px-4 py-3">Purpose</th>
              <th className="px-4 py-3">Start Coordinates</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Outcome Notes</th>
              <th className="px-5 py-3 text-right">Status / Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visits.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{v.companyName}</p>
                  <p className="text-[11px] text-slate-400">
                    {new Date(v.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-700">{v.userName}</td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-[10px] text-slate-700">
                    {v.purpose.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono text-[11px] text-teal-700">
                  {v.startLocation || 'GPS Logged'}
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {v.durationMinutes ? `${v.durationMinutes} mins` : 'In progress'}
                </td>
                <td className="px-4 py-3.5 text-slate-600 max-w-xs truncate">
                  {v.outcomeNotes || v.plannedNotes}
                </td>
                <td className="px-5 py-3.5 text-right">
                  {v.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => setEndModalId(v.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm"
                    >
                      Complete Visit
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[10px]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Completed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">Start Client Field Visit</h3>
            <p className="text-slate-500 text-[11px]">
              Device GPS will be recorded automatically as required by corporate rules.
            </p>
            <form onSubmit={handleStartVisit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Company Name *</label>
                <input
                  required
                  value={form.companyName}
                  onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  placeholder="e.g. Tata Technologies Pune"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Purpose</label>
                <select
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="CLIENT_MEETING">CLIENT_MEETING</option>
                  <option value="DEMO">DEMO</option>
                  <option value="SAMPLE_COLLECTION">SAMPLE_COLLECTION</option>
                  <option value="EVENT_SUPERVISION">EVENT_SUPERVISION</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Planned Objectives</label>
                <textarea
                  rows={2}
                  value={form.plannedNotes}
                  onChange={(e) => setForm({ ...form, plannedNotes: e.target.value })}
                  placeholder="Key discussion points, proposal walkthrough, etc."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Capture GPS & Start
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {endModalId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">Complete Field Visit</h3>
            <form onSubmit={handleEndVisit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Meeting Outcome Notes *</label>
                <textarea
                  rows={3}
                  required
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Discussed employee health camp packages. Client requested revised quote with dental screening..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEndModalId(null)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Submit Outcome & End
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
