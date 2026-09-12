import React, { useState, useEffect } from 'react';
import { expensesApi } from '../../api/endpoints';
import { ExpenseDto } from '../../types/api';
import { Wallet, Plus, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from '../../utils/errors';
import { useAuth } from '../../context/AuthContext';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    category: 'TRAVEL' as any,
    amount: 1500,
    receiptReference: 'TICKET-9284',
    notes: 'Cab travel to client office for wellness kickoff meeting',
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await expensesApi.getExpenses();
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesApi.submitExpense(form);
      setShowModal(false);
      load();
    } catch {
      // handled
    }
  };

  const handleDecide = async (id: string, decision: 'APPROVED' | 'REJECTED') => {
    const remarks = prompt(`Enter mandatory remarks for ${decision}:`);
    if (remarks === null) return;
    if (!remarks.trim()) {
      toast.warning('Remarks are mandatory');
      return;
    }

    try {
      await expensesApi.decideExpense(id, decision, remarks);
      load();
    } catch {
      // handled
    }
  };

  const handleReimburse = async (id: string) => {
    try {
      await expensesApi.reimburseExpense(id, 'UPI', `TXN-${Date.now()}`);
      load();
    } catch {
      // handled
    }
  };

  const isManagerOrAbove = user?.role === 'MANAGER' || user?.role === 'SUPER_MANAGER';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Wallet className="w-5 h-5 text-teal-600" /> Staff Expense Claims & Reimbursements
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Submit field visit travel expenses, monitor approval escalation limits, and process payouts.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Claim Expense</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Claimant / Date</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Receipt Ref / Description</th>
              <th className="px-4 py-3">Approver Route</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{exp.submittedByName}</p>
                  <p className="text-[11px] font-mono text-slate-400">{exp.expenseDate}</p>
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-700">{exp.category}</td>
                <td className="px-4 py-3.5">
                  <p className="text-slate-800 max-w-xs truncate">{exp.notes}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{exp.receiptReference}</p>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{exp.approverName}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      exp.status === 'REIMBURSED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : exp.status === 'APPROVED'
                        ? 'bg-sky-50 text-sky-700 border border-sky-200'
                        : exp.status === 'REJECTED'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {exp.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-bold text-slate-900">
                  ₹{exp.amount.toLocaleString('en-IN')}
                </td>
                <td className="px-5 py-3.5 text-right space-x-1.5">
                  {exp.status === 'PENDING' && isManagerOrAbove && (
                    <>
                      <button
                        onClick={() => handleDecide(exp.id, 'APPROVED')}
                        className="px-2 py-1 text-white bg-emerald-600 hover:bg-emerald-700 rounded text-[10px] font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleDecide(exp.id, 'REJECTED')}
                        className="px-2 py-1 text-red-700 bg-red-50 hover:bg-red-100 rounded text-[10px] font-semibold border border-red-200"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {exp.status === 'APPROVED' && isManagerOrAbove && (
                    <button
                      onClick={() => handleReimburse(exp.id)}
                      className="px-2.5 py-1 text-white bg-teal-600 hover:bg-teal-700 rounded text-[10px] font-semibold"
                    >
                      Reimburse
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs">
            <h3 className="font-bold text-base text-slate-800">Submit Expense Claim</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="TRAVEL">TRAVEL</option>
                  <option value="FOOD">FOOD</option>
                  <option value="STAY">STAY</option>
                  <option value="PHONE">PHONE</option>
                  <option value="MISCELLANEOUS">MISCELLANEOUS</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Receipt / Invoice Ref</label>
                <input
                  value={form.receiptReference}
                  onChange={(e) => setForm({ ...form, receiptReference: e.target.value })}
                  placeholder="Ticket or receipt number"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Claim Justification</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Purpose of expenditure..."
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
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
