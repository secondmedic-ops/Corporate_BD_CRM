import React, { useState, useEffect } from 'react';
import { vendorsApi } from '../../api/endpoints';
import { VendorDto } from '../../types/api';
import { Truck, Plus, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePermissions } from '../../hooks/usePermissions';

export const VendorsPage: React.FC = () => {
  const { user } = usePermissions();
  const [vendors, setVendors] = useState<VendorDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await vendorsApi.getVendors();
      setVendors(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleEmpanel = async (id: string) => {
    try {
      await vendorsApi.empanelVendor(id);
      load();
    } catch {
      // handled
    }
  };

  const canEmpanel = user?.role === 'SUPER_MANAGER' || user?.department === 'OPERATIONS';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-600" /> Healthcare Vendor & Lab Network
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Diagnostic labs, screening partners, pharmacy suppliers, compliance documentation, and empanelment approval.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Vendor Code / Name</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Contact Person</th>
              <th className="px-4 py-3">Coverage Cities</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-5 py-3 text-right">Empanelment Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{v.vendorName}</p>
                  <p className="text-[11px] font-mono text-teal-600">{v.vendorCode}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-semibold text-[10px]">
                    {v.category}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <p className="text-slate-800 font-medium">{v.contactPerson}</p>
                  <p className="text-[11px] text-slate-400">{v.phone}</p>
                </td>
                <td className="px-4 py-3.5 text-slate-600">{v.citiesCovered.join(', ')}</td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                      v.status === 'EMPANELLED'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}
                  >
                    {v.status === 'EMPANELLED' ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-3 h-3 text-amber-600" />
                    )}
                    {v.status}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  {v.status !== 'EMPANELLED' && canEmpanel ? (
                    <button
                      onClick={() => handleEmpanel(v.id)}
                      className="px-2.5 py-1 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                    >
                      Empanel Vendor
                    </button>
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">Verified Partner</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
