import React, { useState, useEffect } from 'react';
import { vendorBillsApi } from '../../api/endpoints';
import { VendorBillDto } from '../../types/api';
import { CreditCard, Plus, CheckCircle2, DollarSign } from 'lucide-react';

export const VendorBillsPage: React.FC = () => {
  const [bills, setBills] = useState<VendorBillDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vendorBillsApi.getBills();
      setBills(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-teal-600" /> Vendor Payables & Diagnostic Bills
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Partner diagnostic lab invoices, payment aging schedules, and disbursement tracking.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Bill Ref / Vendor</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Bill Date / Due</th>
              <th className="px-4 py-3">Total Amount</th>
              <th className="px-4 py-3">Paid / Pending Balance</th>
              <th className="px-5 py-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {bills.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{b.vendorName}</p>
                  <p className="text-[11px] font-mono text-teal-600">{b.billReference}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-semibold">
                    {b.category}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  <p>{b.billDate}</p>
                  <p className="text-[10px] text-slate-400">Due: {b.dueDate}</p>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900">
                  ₹{b.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-emerald-700 font-semibold">Paid: ₹{b.paidAmount.toLocaleString('en-IN')}</p>
                  <p className="text-amber-700 font-medium text-[11px]">Bal: ₹{b.balanceAmount.toLocaleString('en-IN')}</p>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      b.status === 'PAID'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
