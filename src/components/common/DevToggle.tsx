import React, { useState } from 'react';
import { isMockMode, setMockMode, simulateServerError, setSimulateServerError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../api/mock/adapter';
import { Settings2, RotateCcw, AlertOctagon, UserCircle2, ChevronUp, ChevronDown, RefreshCw } from 'lucide-react';
import { toast } from '../../utils/errors';

export const DevToggle: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [mock, setMock] = useState(isMockMode);
  const [simError, setSimError] = useState(simulateServerError);
  const { user, switchUser } = useAuth();

  const handleToggleMock = (val: boolean) => {
    setMock(val);
    setMockMode(val);
    toast.info(`Switched to ${val ? 'Mock Mode' : 'Live Java API Backend'}`);
    setTimeout(() => window.location.reload(), 400);
  };

  const handleToggleSimError = (val: boolean) => {
    setSimError(val);
    setSimulateServerError(val);
    if (val) {
      toast.warning('Simulating 500 SERVER_ERROR on next API calls');
    } else {
      toast.info('Simulated errors cleared');
    }
  };

  const handleResetData = () => {
    if (confirm('Reset all mock storage data back to initial seed state?')) {
      db.resetAll();
      toast.success('Mock data reset to initial seeds');
      setTimeout(() => window.location.reload(), 300);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 font-sans">
      <div className="bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 overflow-hidden text-xs max-w-xs transition-all">
        <div
          onClick={() => setOpen(!open)}
          className="px-3 py-2 flex items-center justify-between cursor-pointer bg-slate-800 hover:bg-slate-750 select-none"
        >
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold tracking-wide">Dev Tools</span>
            <span className="text-[10px] px-1.5 py-0.2 bg-teal-900/60 text-teal-300 rounded border border-teal-700">
              {mock ? 'MOCK' : 'LIVE'}
            </span>
          </div>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronUp className="w-3.5 h-3.5 text-slate-400" />}
        </div>

        {open && (
          <div className="p-3.5 space-y-3 bg-slate-900/95 divide-y divide-slate-800">
            {/* Persona Switcher */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <UserCircle2 className="w-3.5 h-3.5 text-teal-400" /> Current User
                </span>
                <span className="text-[11px] text-teal-300 font-semibold">{user?.role}</span>
              </div>
              <select
                value={user?.email || ''}
                onChange={(e) => switchUser(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1.5 text-white text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
              >
                {db.users.map((u) => (
                  <option key={u.id} value={u.email}>
                    {u.fullName} ({u.role.replace('_', ' ')} - {u.department || 'All'})
                  </option>
                ))}
              </select>
            </div>

            {/* Mock / Live Toggle */}
            <div className="pt-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-slate-300">Mock Mode</span>
                <span className="text-[10px] text-slate-400">Route to in-memory adapter</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mock}
                  onChange={(e) => handleToggleMock(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Error Simulator */}
            <div className="pt-2.5 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="font-medium text-slate-300">Simulate 500 Error</span>
                <span className="text-[10px] text-slate-400">Trigger contract error toast</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={simError}
                  onChange={(e) => handleToggleSimError(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
              </label>
            </div>

            {/* Reset Data */}
            <div className="pt-2.5 flex justify-end">
              <button
                onClick={handleResetData}
                className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" /> Reset Seed Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
