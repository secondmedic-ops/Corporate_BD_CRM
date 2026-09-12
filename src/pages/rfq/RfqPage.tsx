import React, { useState, useEffect } from 'react';
import { rfqApi } from '../../api/endpoints';
import { RfqDto } from '../../types/api';
import { FileSpreadsheet, Plus, DollarSign, Calendar, Building, CheckCircle2 } from 'lucide-react';

export const RfqPage: React.FC = () => {
  const [rfqs, setRfqs] = useState<RfqDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await rfqApi.getRfqs();
        setRfqs(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-600" /> RFQ & Vendor Quotations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corporate package scopes, partner diagnostic pricing, discount governance, and final quote compilation.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">RFQ Code / Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Scope of Work</th>
              <th className="px-4 py-3">Vendor Quotes</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-5 py-3 text-right">Final Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rfqs.map((rfq) => (
              <tr key={rfq.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{rfq.leadCompany}</p>
                  <p className="text-[11px] font-mono text-teal-600">{rfq.rfqCode}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 bg-sky-50 text-sky-700 border border-sky-200 rounded text-[10px] font-semibold">
                    {rfq.status}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate">{rfq.requirementScope}</td>
                <td className="px-4 py-3.5 text-slate-600">
                  {rfq.vendorQuotes?.length || 0} quotes received
                </td>
                <td className="px-4 py-3.5 font-semibold text-slate-700">{rfq.discountPercent}%</td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                  ₹{rfq.finalAmount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
