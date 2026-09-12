import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadsApi, approvalsApi } from '../../api/endpoints';
import { LeadDto, ApprovalStep } from '../../types/api';
import { CheckCheck, ArrowRight, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from '../../utils/errors';

export const ApprovalsCenterPage: React.FC = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState<LeadDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [decisionModal, setDecisionModal] = useState<{
    open: boolean;
    leadId: string | null;
    step: ApprovalStep | null;
    decision: 'APPROVED' | 'REJECTED';
    remarks: string;
  }>({
    open: false,
    leadId: null,
    step: null,
    decision: 'APPROVED',
    remarks: '',
  });

  const loadLeadsWithPending = async () => {
    setLoading(true);
    try {
      const allLeads = await leadsApi.getLeads();
      setLeads(allLeads);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeadsWithPending();
  }, []);

  const pendingItems: { lead: LeadDto; step: ApprovalStep; stepIdx: number }[] = [];
  leads.forEach((l) => {
    const pendingSteps = l.approvals.filter((s) => s.decision === 'PENDING');
    if (pendingSteps.length > 0) {
      // only earliest pending is actionable!
      const earliest = pendingSteps[0];
      const idx = l.approvals.findIndex((s) => s.step === earliest.step);
      pendingItems.push({ lead: l, step: earliest.step, stepIdx: idx + 1 });
    }
  });

  const handleConfirmDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!decisionModal.leadId || !decisionModal.step) return;
    if (!decisionModal.remarks.trim()) {
      toast.warning('Mandatory remarks required for sign-off decision.');
      return;
    }

    try {
      await approvalsApi.decideStep(
        decisionModal.leadId,
        decisionModal.step,
        decisionModal.decision,
        decisionModal.remarks
      );
      setDecisionModal({ open: false, leadId: null, step: null, decision: 'APPROVED', remarks: '' });
      loadLeadsWithPending();
    } catch {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CheckCheck className="w-5 h-5 text-teal-600" /> Multi-Step Approvals Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict 7-tier governance queue. Approvals must proceed sequentially: Step 1 (Quotation) → Step 7 (Closure & Billing).
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {pendingItems.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 shadow-sm text-xs text-slate-400">
            All approval queues cleared. No pending sign-offs.
          </div>
        ) : (
          pendingItems.map(({ lead, step, stepIdx }) => (
            <div
              key={`${lead.id}-${step}`}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-teal-600 font-semibold">{lead.leadCode}</span>
                  <span className="font-bold text-slate-900 text-sm">{lead.companyName}</span>
                </div>
                <div className="text-slate-500 flex items-center gap-2">
                  <span>Owner: {lead.ownerName}</span>
                  <span>•</span>
                  <span>Deal Value: ₹{lead.expectedValue.toLocaleString('en-IN')}</span>
                  <span>•</span>
                  <span>Current Stage: {lead.stage}</span>
                </div>
                <div className="pt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-50 text-amber-900 font-semibold border border-amber-200">
                    <Clock className="w-3.5 h-3.5 text-amber-600" />
                    Step {stepIdx}: {step.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setDecisionModal({
                      open: true,
                      leadId: lead.id,
                      step,
                      decision: 'APPROVED',
                      remarks: '',
                    })
                  }
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                >
                  Approve Step
                </button>
                <button
                  onClick={() =>
                    setDecisionModal({
                      open: true,
                      leadId: lead.id,
                      step,
                      decision: 'REJECTED',
                      remarks: '',
                    })
                  }
                  className="px-3 py-2 text-xs font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
                >
                  Reject
                </button>
                <button
                  onClick={() => navigate(`/leads/${lead.id}`)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {decisionModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">
              Sign-off: {decisionModal.step?.replace(/_/g, ' ')} ({decisionModal.decision})
            </h3>
            <form onSubmit={handleConfirmDecision} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mandatory Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={decisionModal.remarks}
                  onChange={(e) => setDecisionModal({ ...decisionModal, remarks: e.target.value })}
                  placeholder="Enter approval criteria, pricing verification, or reason for rejection..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setDecisionModal({ open: false, leadId: null, step: null, decision: 'APPROVED', remarks: '' })}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-semibold rounded-lg ${
                    decisionModal.decision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {decisionModal.decision}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
