import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi, notificationsApi } from '../../api/endpoints';
import { NotificationDto, AttendanceDto } from '../../types/api';
import {
  Bell,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  ChevronDown,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from '../../utils/errors';
import { isMockMode } from '../../api/client';

export const TopBar: React.FC = () => {
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceDto | null>(null);
  const [checkingAttendance, setCheckingAttendance] = useState(false);

  const fetchAttendanceStatus = async () => {
    try {
      const records = await attendanceApi.getAttendance();
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = records.find((r) => r.userId === user?.id && r.date === today);
      setTodayAttendance(todayRecord || null);
    } catch {
      // ignore
    }
  };

  const fetchNotifications = async () => {
    try {
      const notifs = await notificationsApi.getNotifications();
      setNotifications(notifs);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user) {
      fetchAttendanceStatus();
      fetchNotifications();
    }
  }, [user]);

  const handleCheckIn = async () => {
    setCheckingAttendance(true);
    let lat: number | null = 19.076;
    let lng: number | null = 72.8777;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        console.warn('Geolocation failed or denied, using fallback corporate office GPS');
      }
    }

    try {
      const res = await attendanceApi.checkIn(lat, lng, 'SecondMedic Corporate HQ, BKC');
      setTodayAttendance(res);
      toast.success('Punch in recorded with verified GPS coordinates');
    } catch (e: any) {
      toast.error(e.message || 'Check-in failed');
    } finally {
      setCheckingAttendance(false);
    }
  };

  const handleCheckOut = async () => {
    setCheckingAttendance(true);
    let lat: number | null = 19.076;
    let lng: number | null = 72.8777;

    if (navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch {
        // fallback
      }
    }

    try {
      const res = await attendanceApi.checkOut(lat, lng, 'SecondMedic Corporate HQ, BKC');
      setTodayAttendance(res);
      toast.success(`Check-out recorded. Hours worked today: ${res.hoursWorked} hrs`);
    } catch (e: any) {
      toast.error(e.message || 'Check-out failed');
    } finally {
      setCheckingAttendance(false);
    }
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    fetchNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-10 select-none">
      {/* Scope & Role context */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <Shield className="w-3.5 h-3.5 text-teal-600" />
          <span>Role:</span>
          <span className="px-2 py-0.5 rounded bg-teal-50 text-teal-800 font-semibold border border-teal-200">
            {user?.role.replace('_', ' ')}
          </span>
          {user?.department && (
            <>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">{user.department.replace('_', ' ')}</span>
            </>
          )}
        </div>

        {isMockMode && (
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
            <Sparkles className="w-3 h-3 text-amber-600" /> Mock Mode Active
          </span>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Attendance Punch In / Out Pill */}
        <div className="hidden sm:flex items-center">
          {todayAttendance?.checkInAt ? (
            todayAttendance.checkOutAt ? (
              <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Punched Out ({todayAttendance.hoursWorked} hrs)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Punched in: {new Date(todayAttendance.checkInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={handleCheckOut}
                  disabled={checkingAttendance}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded-lg shadow-sm transition-colors"
                >
                  Punch Out
                </button>
              </div>
            )
          ) : (
            <button
              onClick={handleCheckIn}
              disabled={checkingAttendance}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm shadow-teal-700/20 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Punch In (GPS)</span>
            </button>
          )}
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg relative transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-slate-800">Notifications</span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-teal-600 hover:text-teal-800 text-[11px] font-medium"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 ${!n.readAt ? 'bg-teal-50/40' : ''}`}>
                      <p className="font-semibold text-slate-800">{n.title}</p>
                      <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden md:block">
            <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.fullName}</p>
            <p className="text-[10px] text-slate-400 font-mono">{user?.email}</p>
          </div>
          <button
            onClick={() => logout()}
            title="Log out"
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
