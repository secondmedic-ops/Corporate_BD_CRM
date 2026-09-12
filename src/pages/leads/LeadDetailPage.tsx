import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsApi, approvalsApi, rfqApi, invoicesApi } from '../../api/endpoints';
import { LeadDto, PipelineStage, ApprovalStep } from '../../types/api';
import { usePermissions, Can, RestrictedFieldBadge } from '../../hooks/usePermissions';
import {
  ArrowLeft,
  Building,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Send,
  Lock,
  FileSpreadsheet,
  Receipt,
  FileCheck,
  ChevronRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { toast } from '../../utils/errors';

const STAGES: PipelineStage[] = [
  'L1_LEAD_CAPTURE',
  'L2_QUALIFIED',
  'L3_RFQ_RAISED',
  'L4_PROPOSAL',
  'L5_WON',
];

const APPROVAL_STEPS: { step: ApprovalStep; label: string; role: string }[] = [
  { step: 'QUOTATION_UPDATE', label: 'Quotation Update', role: 'BD Manager' },
  { step: 'NEGOTIATION', label: 'Commercial Negotiation', role: 'BD Manager' },
  { step: 'SPECIAL_APPROVAL', label: 'Special Pricing / Discount', role: 'Business Head' },
  { step: 'CLIENT_CONFIRMATION', label: 'Client PO Confirmation', role: 'BD Manager' },
  { step: 'PROJECT_KICKOFF', label: 'Project Kickoff Handover', role: 'Operations Manager' },
  { step: 'EXECUTION', label: 'Operations Delivery', role: 'Operations Head' },
  { step: 'CLOSURE_BILLING', label: 'Closure & Invoice Clearance', role: 'Finance Head' },
];

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, can, isFieldRestricted, rule } = usePermissions();

  const [lead, setLead] = useState<LeadDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'approvals' | 'activities'>('details');

  // Stage change modal state
  const [stageModal, setStageModal] = useState<{
    open: boolean;
    targetStage: PipelineStage | null;
    isBackward: boolean;
    note: string;
  }>({
    open: false,
    targetStage: null,
    isBackward: false,
    note: '',
  });

  // Approval decision modal state
  const [approvalModal, setApprovalModal] = useState<{
    open: boolean;
    step: ApprovalStep | null;
    decision: 'APPROVED' | 'REJECTED' | 'SENT_BACK';
    remarks: string;
  }>({
    open: false,
    step: null,
    decision: 'APPROVED',
    remarks: '',
  });

  const loadLead = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await leadsApi.getLead(id);
      setLead(data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [id, user]);

  if (loading || !lead) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isLockedForStaff =
    user?.role === 'STAFF' && Boolean(rule('lockAfterApprovalStarts')) && Boolean(lead.approvalStartedAt);

  const currStageIndex = STAGES.indexOf(lead.stage as PipelineStage);

  // Handle stage click
  const handleStageClick = (targetStage: PipelineStage) => {
    if (lead.stage === targetStage) return;

    if (targetStage === 'L5_WON') {
      toast.warning('L5_WON is set only by the approval service when step 7 (CLOSURE_BILLING) completes.');
      return;
    }

    const targetIdx = STAGES.indexOf(targetStage);
    if (targetIdx > currStageIndex) {
      // Forward move
      if (targetIdx !== currStageIndex + 1) {
        toast.warning('Stage progression is strictly sequential (1 step at a time).');
        return;
      }
      // Check max lead value rule
      const maxVal = rule('maxLeadValueWithoutApproval');
      if (
        currStageIndex >= 1 &&
        typeof maxVal === 'number' &&
        lead.expectedValue > maxVal &&
        user?.role === 'STAFF'
      ) {
        toast.error(
          `Expected value ₹${lead.expectedValue.toLocaleString('en-IN')} exceeds your limit (₹${maxVal.toLocaleString('en-IN')}) without manager sign-off.`,
          'RULE_BLOCKED'
        );
        return;
      }
      setStageModal({ open: true, targetStage, isBackward: false, note: '' });
    } else {
      // Backward move
      setStageModal({ open: true, targetStage, isBackward: true, note: '' });
    }
  };

  const handleConfirmStageChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageModal.targetStage) return;
    if (stageModal.isBackward && !stageModal.note.trim()) {
      toast.warning('A reason note is mandatory when moving a stage backwards.');
      return;
    }

    try {
      const updated = await leadsApi.updateStage(lead.id, stageModal.targetStage, stageModal.note);
      setLead(updated);
      setStageModal({ open: false, targetStage: null, isBackward: false, note: '' });
    } catch {
      // handled
    }
  };

  const handleMarkLost = async () => {
    const reason = prompt('Please enter mandatory reason for marking deal as LOST:');
    if (reason === null) return;
    if (!reason.trim()) {
      toast.warning('Lost reason cannot be blank');
      return;
    }

    try {
      const updated = await leadsApi.updateStage(lead.id, 'LOST', reason);
      setLead(updated);
    } catch {
      // handled
    }
  };

  const handleConfirmApprovalDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvalModal.step) return;
    if (!approvalModal.remarks.trim()) {
      toast.warning('Mandatory remarks are required for approval decision.');
      return;
    }

    try {
      const updated = await approvalsApi.decideStep(
        lead.id,
        approvalModal.step,
        approvalModal.decision,
        approvalModal.remarks
      );
      setLead(updated);
      setApprovalModal({ open: false, step: null, decision: 'APPROVED', remarks: '' });
    } catch {
      // handled
    }
  };

  const handleRaiseRfq = async () => {
    try {
      const rfq = await rfqApi.createRfq({
        leadId: lead.id,
        leadCompany: lead.companyName,
        clientContactName: lead.contactPerson,
        clientContactPhone: lead.phone,
        requirementScope: lead.notes || 'Corporate health checkup packages and screening',
        targetDate: lead.expectedClosureDate,
        finalAmount: lead.expectedValue,
      });
      toast.success(`RFQ ${rfq.rfqCode} raised successfully!`);
      loadLead();
    } catch {
      // handled
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const inv = await invoicesApi.createInvoice({
        leadId: lead.id,
        clientName: lead.companyName,
        amount: lead.expectedValue,
        paymentTerms: 'Net 30',
        notes: `Auto-generated from won corporate deal ${lead.leadCode}`,
      });
      toast.success(`Invoice ${inv.invoiceNo} generated in DRAFT!`);
    } catch {
      // handled
    }
  };

  const earliestPendingStep = lead.approvals.find((s) => s.decision === 'PENDING')?.step;

  return (
    <div className="space-y-6">
      {/* Back button & Title bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/leads')}
            className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{lead.companyName}</h1>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-50 text-teal-700 font-semibold border border-teal-200">
                {lead.leadCode}
              </span>
              {lead.stage === 'LOST' && (
                <span className="text-xs px-2 py-0.5 rounded bg-red-50 text-red-700 font-bold border border-red-200">
                  DEAL LOST
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Owner: <strong className="text-slate-700">{lead.ownerName}</strong> • Source:{' '}
              {lead.source.replace('_', ' ')}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          {(lead.stage === 'L2_QUALIFIED' || lead.stage === 'L3_RFQ_RAISED') && (
            <button
              onClick={handleRaiseRfq}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Raise RFQ</span>
            </button>
          )}

          {lead.stage === 'L5_WON' && (
            <button
              onClick={handleGenerateInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Generate Invoice</span>
            </button>
          )}

          {lead.stage !== 'LOST' && lead.stage !== 'L5_WON' && (
            <button
              onClick={handleMarkLost}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition-colors"
            >
              Mark Lost
            </button>
          )}
        </div>
      </div>

      {/* Warning banner if locked */}
      {isLockedForStaff && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <Lock className="w-4 h-4 text-amber-600 shrink-0" />
          <div>
            <strong>Fields Locked by Manager Rule:</strong> Approval workflow began on{' '}
            {new Date(lead.approvalStartedAt!).toLocaleDateString()}. Deal value, quote status, and owner
            are locked for staff edits.
          </div>
        </div>
      )}

      {/* Sequential Pipeline Stepper */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span className="font-semibold text-slate-700 uppercase tracking-wider">
            Sequential Pipeline Stage
          </span>
          <span>Click next stage to progress (Strict 1-step rule)</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {STAGES.map((stg, idx) => {
            const isCompleted = idx < currStageIndex;
            const isCurrent = lead.stage === stg;
            const isNext = idx === currStageIndex + 1;

            return (
              <button
                key={stg}
                onClick={() => handleStageClick(stg)}
                disabled={lead.stage === 'LOST'}
                className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                  isCurrent
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                    : isCompleted
                    ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                    : isNext
                    ? 'bg-white text-slate-700 border-slate-300 hover:border-teal-400 hover:bg-slate-50'
                    : 'bg-slate-50 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  {isCompleted ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                  ) : (
                    <span>{idx + 1}.</span>
                  )}
                  <span>{stg.replace('L', 'Stage ').replace(/_/g, ' ')}</span>
                </div>
                <span className="text-[10px] mt-0.5 opacity-80">
                  {stg === 'L5_WON' ? 'Won via Approvals' : isCurrent ? 'Active Stage' : 'Sequential'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Subtabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('details')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'details' ? 'bg-white text-slate-800 shadow-sm border' : 'text-slate-500'
          }`}
        >
          Deal Overview
        </button>
        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
            activeTab === 'approvals' ? 'bg-white text-slate-800 shadow-sm border' : 'text-slate-500'
          }`}
        >
          <span>7-Step Approvals</span>
          <span className="px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full text-[10px]">
            {lead.approvals.filter((s) => s.decision === 'APPROVED').length}/7
          </span>
        </button>
        <button
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'activities' ? 'bg-white text-slate-800 shadow-sm border' : 'text-slate-500'
          }`}
        >
          Activity Trail ({lead.activities.length})
        </button>
      </div>

      {/* Tab 1: Deal Overview */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Corporate Profile & Scope</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Industry</span>
                <span className="text-slate-800 font-semibold">{lead.industry}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Location</span>
                <span className="text-slate-800 font-semibold">{lead.city}, {lead.state}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Contact Person</span>
                <span className="text-slate-800 font-semibold">{lead.contactPerson} ({lead.designation})</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Contact Coordinates</span>
                <span className="text-slate-800 font-semibold">{lead.phone} • {lead.email || 'N/A'}</span>
              </div>
            </div>

            <div className="pt-2">
              <span className="text-slate-400 block font-medium text-xs mb-1">Deal Notes & Requirements</span>
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 leading-relaxed border">
                {lead.notes || 'No detailed requirements provided.'}
              </div>
            </div>

            {lead.lostReason && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900">
                <strong className="block mb-0.5">Lost Reason Logged:</strong>
                {lead.lostReason}
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Deal Economics</h3>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Expected Value</span>
                {isLockedForStaff && <RestrictedFieldBadge fieldName="expectedValue" />}
              </div>
              <p className="text-2xl font-bold text-teal-700 mt-1">
                ₹{lead.expectedValue.toLocaleString('en-IN')}
              </p>
            </div>

            <div className="border-t pt-3">
              <span className="text-slate-500 font-medium block">Target Closure Date</span>
              <p className="text-slate-800 font-semibold mt-0.5">
                {new Date(lead.expectedClosureDate).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>

            <div className="border-t pt-3">
              <span className="text-slate-500 font-medium block">Quotation Status</span>
              <p className="text-slate-800 font-semibold mt-0.5">{lead.quoteStatus}</p>
            </div>

            <div className="border-t pt-3">
              <span className="text-slate-500 font-medium block">Workflow Initiation</span>
              <p className="text-slate-800 font-semibold mt-0.5">
                {lead.approvalStartedAt
                  ? new Date(lead.approvalStartedAt).toLocaleString()
                  : 'Not started yet'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: 7-Step Approvals */}
      {activeTab === 'approvals' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> 7-Step Sequential Sign-off Engine
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Only the earliest pending step can be acted upon. Step 7 unlocks L5_WON deal closure and billing eligibility.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-teal-50 text-teal-800 border border-teal-200">
              Current Actionable: {earliestPendingStep || 'All Steps Complete'}
            </span>
          </div>

          <div className="space-y-3">
            {APPROVAL_STEPS.map(({ step, label, role }, idx) => {
              const stepRecord = lead.approvals.find((s) => s.step === step);
              const decision = stepRecord?.decision || 'PENDING';
              const isActionable = earliestPendingStep === step;

              const statusColor =
                decision === 'APPROVED'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : decision === 'REJECTED'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : isActionable
                  ? 'bg-amber-50/70 border-amber-300 text-amber-950 ring-1 ring-amber-300'
                  : 'bg-slate-50/60 border-slate-200 text-slate-500 opacity-80';

              return (
                <div
                  key={step}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${statusColor}`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        decision === 'APPROVED'
                          ? 'bg-emerald-600 text-white'
                          : decision === 'REJECTED'
                          ? 'bg-red-600 text-white'
                          : isActionable
                          ? 'bg-amber-500 text-white animate-pulse'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{label}</span>
                        <span className="text-[10px] px-1.5 py-0.2 bg-white/80 border rounded font-semibold text-slate-600">
                          {role}
                        </span>
                      </div>
                      {stepRecord?.remarks && (
                        <p className="text-slate-700 mt-1 italic bg-white/60 p-1.5 rounded border">
                          "{stepRecord.remarks}" — {stepRecord.approverName} ({new Date(stepRecord.decidedAt!).toLocaleString()})
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {decision === 'APPROVED' && (
                      <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded">
                        <CheckCircle2 className="w-4 h-4" /> APPROVED
                      </span>
                    )}

                    {decision === 'REJECTED' && (
                      <span className="flex items-center gap-1 font-bold text-red-700 bg-red-100/80 px-2.5 py-1 rounded">
                        <XCircle className="w-4 h-4" /> REJECTED
                      </span>
                    )}

                    {decision === 'PENDING' && isActionable && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            setApprovalModal({ open: true, step, decision: 'APPROVED', remarks: '' })
                          }
                          className="px-3 py-1.5 font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() =>
                            setApprovalModal({ open: true, step, decision: 'REJECTED', remarks: '' })
                          }
                          className="px-2.5 py-1.5 font-semibold text-red-700 bg-white hover:bg-red-50 border border-red-300 rounded-lg"
                        >
                          Reject
                        </button>
                        {idx > 0 && (
                          <button
                            onClick={() =>
                              setApprovalModal({ open: true, step, decision: 'SENT_BACK', remarks: '' })
                            }
                            className="px-2 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg"
                          >
                            Send Back
                          </button>
                        )}
                      </div>
                    )}

                    {decision === 'PENDING' && !isActionable && (
                      <span className="text-slate-400 font-medium italic">Pending Prior Steps</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Activity Trail */}
      {activeTab === 'activities' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-800 border-b pb-2">Audit & Event History</h3>
          <div className="space-y-4 relative before:absolute before:inset-0 before:left-3 before:w-0.5 before:bg-slate-200">
            {lead.activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-4 pl-8 text-xs">
                <div className="absolute left-1.5 top-1 w-3.5 h-3.5 rounded-full bg-teal-600 border-2 border-white"></div>
                <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-semibold text-slate-800">{act.actorName}</span>
                    <span className="text-[10px]">{new Date(act.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-700">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stage Progression Modal */}
      {stageModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">
              Move Deal to {stageModal.targetStage?.replace(/_/g, ' ')}
            </h3>

            {stageModal.isBackward ? (
              <p className="text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                Backward stage movement requires an audited explanatory note.
              </p>
            ) : (
              <p className="text-slate-600">
                Advancing stage sequentially. Add an optional activity note for the team.
              </p>
            )}

            <form onSubmit={handleConfirmStageChange} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  Reason / Notes {stageModal.isBackward && '*'}
                </label>
                <textarea
                  rows={3}
                  required={stageModal.isBackward}
                  value={stageModal.note}
                  onChange={(e) => setStageModal({ ...stageModal, note: e.target.value })}
                  placeholder={
                    stageModal.isBackward
                      ? 'Why is this deal moving backward?'
                      : 'E.g. Client confirmed qualification criteria'
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setStageModal({ open: false, targetStage: null, isBackward: false, note: '' })}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Confirm Transition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Decision Modal */}
      {approvalModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">
              Sign-off: {approvalModal.step?.replace(/_/g, ' ')} ({approvalModal.decision})
            </h3>
            <p className="text-slate-600">
              Your decision will be permanently logged in the audit trail.
            </p>

            <form onSubmit={handleConfirmApprovalDecision} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Mandatory Remarks *</label>
                <textarea
                  rows={3}
                  required
                  value={approvalModal.remarks}
                  onChange={(e) => setApprovalModal({ ...approvalModal, remarks: e.target.value })}
                  placeholder="Enter specific grounds for approval, adjustments required, or reason for rejection..."
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setApprovalModal({ open: false, step: null, decision: 'APPROVED', remarks: '' })}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white font-semibold rounded-lg ${
                    approvalModal.decision === 'APPROVED'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirm {approvalModal.decision}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
