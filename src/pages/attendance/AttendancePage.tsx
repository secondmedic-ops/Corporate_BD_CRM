import React, { useState, useEffect } from 'react';
import { attendanceApi } from '../../api/endpoints';
import { AttendanceDto } from '../../types/api';
import { Clock, CheckCircle2, MapPin, Calendar, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AttendancePage: React.FC = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AttendanceDto[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await attendanceApi.getAttendance();
      setRecords(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" /> Attendance & GPS Punch Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Geofence verified punch-in logs, daily shift durations, and automated hour calculations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
            <tr>
              <th className="px-5 py-3">Employee</th>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Punch In</th>
              <th className="px-4 py-3">Punch Out</th>
              <th className="px-4 py-3">GPS Location</th>
              <th className="px-5 py-3 text-right">Hours Logged</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800">{r.userName}</p>
                  <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {r.status}
                  </p>
                </td>
                <td className="px-4 py-3.5 text-slate-600 font-medium">
                  {r.department.replace('_', ' ')}
                </td>
                <td className="px-4 py-3.5 font-mono text-slate-600">{r.date}</td>
                <td className="px-4 py-3.5 font-semibold text-slate-800">
                  {r.checkInAt ? new Date(r.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="px-4 py-3.5 text-slate-600">
                  {r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active Shift'}
                </td>
                <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-teal-600 shrink-0" />
                  <span>{r.checkInLocation || 'Recorded GPS'}</span>
                </td>
                <td className="px-5 py-3.5 text-right font-bold text-slate-900">
                  {r.hoursWorked} hrs
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
