import React, { useState, useEffect } from 'react';
import { usersApi } from '../../api/endpoints';
import { UserDto } from '../../types/api';
import { Users, Mail, Phone, ShieldCheck, MapPin } from 'lucide-react';

export const TeamPage: React.FC = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await usersApi.getUsers();
        setUsers(data);
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
            <Users className="w-5 h-5 text-teal-600" /> Corporate BD & Operations Roster
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-functional team roster across Business Development, Operations, Finance, and Leadership.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 text-xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">{u.name}</h3>
                <span className="text-[11px] text-teal-700 font-semibold">{u.department}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                {u.role}
              </span>
            </div>

            <div className="space-y-1.5 text-slate-600 border-t pt-3">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{u.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span>{u.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Assigned City: Mumbai Corporate Hub</span>
              </div>
            </div>

            <div className="pt-2 border-t flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Status</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                Active Duty
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
