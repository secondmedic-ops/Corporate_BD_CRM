import React, { useState, useEffect } from 'react';
import { invoicesApi } from '../../api/endpoints';
import { InvoiceDto } from '../../types/api';
import { Receipt, Plus, DollarSign, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from '../../utils/errors';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModal, setPaymentModal] = useState<{
    open: boolean;
    invoice: InvoiceDto | null;
    amount: number;
    paymentMode: any;
    reference: string;
  }>({
    open: false,
    invoice: null,
    amount: 0,
    paymentMode: 'NEFT',
    reference: '',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await invoicesApi.getInvoices();
      setInvoices(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal.invoice) return;
    if (paymentModal.amount <= 0) {
      toast.warning('Payment amount must be greater than zero');
      return;
    }

    try {
      await invoicesApi.recordPayment(
        paymentModal.invoice.id,
        paymentModal.amount,
        paymentModal.paymentMode,
        paymentModal.reference || 'PAY-REF'
      );
      setPaymentModal({ open: false, invoice: null, amount: 0, paymentMode: 'NEFT', reference: '' });
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
            <Receipt className="w-5 h-5 text-teal-600" /> Invoicing, GST & Collections
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Strict corporate constraint: Invoices are raised strictly against Won deals (post Step 7 sign-off) and gated by 3-tier approvals.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Invoice No / Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">3-Tier Approvals</th>
              <th className="px-4 py-3">Invoice Date / Due</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Received / Balance</th>
              <th className="px-5 py-3 text-right">Payment</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{inv.clientName}</p>
                  <p className="text-[11px] font-mono text-teal-600">{inv.invoiceNo}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                      inv.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : inv.status === 'PARTIALLY_PAID'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className={`px-1.5 py-0.2 rounded border ${inv.bdApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-400'}`}>
                      BD: {inv.bdApproved ? '✓' : '—'}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border ${inv.financeApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-400'}`}>
                      FIN: {inv.financeApproved ? '✓' : '—'}
                    </span>
                    <span className={`px-1.5 py-0.2 rounded border ${inv.businessHeadApproved ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-50 text-slate-400'}`}>
                      HEAD: {inv.businessHeadApproved ? '✓' : '—'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  <p>{inv.invoiceDate}</p>
                  <p className="text-[10px] text-slate-400">Due: {inv.dueDate}</p>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900">
                  ₹{inv.totalAmount.toLocaleString('en-IN')}
                  <span className="block text-[10px] text-slate-400 font-normal">incl. 18% GST</span>
                </td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-emerald-700">₹{inv.receivedAmount.toLocaleString('en-IN')}</p>
                  <p className="text-[10px] text-red-600 font-medium">Bal: ₹{inv.balanceAmount.toLocaleString('en-IN')}</p>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {inv.balanceAmount > 0 ? (
                    <button
                      onClick={() =>
                        setPaymentModal({
                          open: true,
                          invoice: inv,
                          amount: inv.balanceAmount,
                          paymentMode: 'NEFT',
                          reference: '',
                        })
                      }
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
                    >
                      Record Payment
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Settled
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {paymentModal.open && paymentModal.invoice && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">
              Record Client Payment: {paymentModal.invoice.invoiceNo}
            </h3>
            <p className="text-slate-500 text-[11px]">
              Outstanding Balance: ₹{paymentModal.invoice.balanceAmount.toLocaleString('en-IN')}
            </p>

            <form onSubmit={handleRecordPayment} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  max={paymentModal.invoice.balanceAmount}
                  value={paymentModal.amount}
                  onChange={(e) => setPaymentModal({ ...paymentModal, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Payment Mode</label>
                <select
                  value={paymentModal.paymentMode}
                  onChange={(e) => setPaymentModal({ ...paymentModal, paymentMode: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="NEFT">NEFT</option>
                  <option value="RTGS">RTGS</option>
                  <option value="IMPS">IMPS</option>
                  <option value="UPI">UPI</option>
                  <option value="CHEQUE">CHEQUE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Bank UTR / Cheque Ref</label>
                <input
                  required
                  value={paymentModal.reference}
                  onChange={(e) => setPaymentModal({ ...paymentModal, reference: e.target.value })}
                  placeholder="e.g. UTR-HDFC9834729"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ open: false, invoice: null, amount: 0, paymentMode: 'NEFT', reference: '' })}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
