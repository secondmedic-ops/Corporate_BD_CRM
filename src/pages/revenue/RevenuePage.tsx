import React, { useState, useEffect } from 'react';
import { revenueApi } from '../../api/endpoints';
import { RevenueDto } from '../../types/api';
import { TrendingUp, Plus, DollarSign, Calendar } from 'lucide-react';

export const RevenuePage: React.FC = () => {
  const [revenues, setRevenues] = useState<RevenueDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await revenueApi.getRevenues();
      setRevenues(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const total = revenues.reduce((acc, r) => acc + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-teal-600" /> Revenue Realization Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Total Realized Revenue:{' '}
            <strong className="text-teal-700 font-bold">
              ₹{total.toLocaleString('en-IN')}
            </strong>{' '}
            across corporate health packages and medical camps.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Client / Organization</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Mode & Reference</th>
              <th className="px-4 py-3">Recorded By</th>
              <th className="px-5 py-3 text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {revenues.map((rev) => (
              <tr key={rev.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-bold text-slate-800">
                  {rev.clientNameFreeText || 'Direct Corporate'}
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 bg-teal-50 text-teal-700 border border-teal-200 rounded text-[10px] font-semibold">
                    {rev.category.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{rev.revenueDate}</td>
                <td className="px-4 py-3.5">
                  <p className="font-semibold text-slate-700">{rev.paymentMode}</p>
                  <p className="text-[10px] font-mono text-slate-400">{rev.referenceNo}</p>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{rev.staffName}</td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-900 text-sm">
                  ₹{rev.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
