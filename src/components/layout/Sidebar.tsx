import React from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { ModuleKey } from '../../types/api';
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  PhoneCall,
  FileSpreadsheet,
  CheckCheck,
  Building2,
  Truck,
  MapPin,
  Clock,
  Receipt,
  CreditCard,
  TrendingUp,
  Wallet,
  UserCog,
  ShieldCheck,
  ScrollText,
  HeartPulse,
} from 'lucide-react';

interface NavItem {
  name: string;
  path: string;
  icon: React.ElementType;
  module?: ModuleKey;
  rolesAllowed?: string[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Pipeline', path: '/pipeline', icon: KanbanSquare, module: 'pipeline' },
  { name: 'Leads', path: '/leads', icon: Users, module: 'leads' },
  { name: 'Cold Calling', path: '/cold-calls', icon: PhoneCall, module: 'cold_calling' },
  { name: 'RFQ & Quotes', path: '/rfq', icon: FileSpreadsheet, module: 'rfq' },
  { name: 'Approvals', path: '/approvals', icon: CheckCheck, module: 'approvals' },
  { name: 'Clients', path: '/clients', icon: Building2, module: 'clients' },
  { name: 'Vendors', path: '/vendors', icon: Truck, module: 'vendors' },
  { name: 'Field Visits', path: '/field-visits', icon: MapPin, module: 'field_visits' },
  { name: 'Attendance', path: '/attendance', icon: Clock, module: 'attendance' },
  { name: 'Invoices', path: '/invoices', icon: Receipt, module: 'invoices' },
  { name: 'Vendor Bills', path: '/vendor-bills', icon: CreditCard, module: 'vendor_payments' },
  { name: 'Revenue', path: '/revenue', icon: TrendingUp, module: 'revenue' },
  { name: 'Expenses', path: '/expenses', icon: Wallet, module: 'expenses' },
  { name: 'Team Performance', path: '/team', icon: UserCog, module: 'team' },
  { name: 'Users & Roles', path: '/users', icon: ShieldCheck, rolesAllowed: ['SUPER_MANAGER', 'MANAGER'] },
  { name: 'Audit Log', path: '/audit-logs', icon: ScrollText, rolesAllowed: ['SUPER_MANAGER'] },
];

export const Sidebar: React.FC = () => {
  const { user, can } = usePermissions();

  const filteredNav = navItems.filter((item) => {
    if (!user) return false;
    if (user.role === 'SUPER_MANAGER') return true;
    if (item.rolesAllowed && !item.rolesAllowed.includes(user.role)) return false;
    if (item.module && !can(item.module, 'view')) return false;
    return true;
  });

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-900/30">
            <HeartPulse className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight flex items-center gap-1.5">
              SecondMedic
              <span className="text-[10px] bg-teal-950 text-teal-400 font-semibold px-1.5 py-0.5 rounded border border-teal-800">
                BD CRM
              </span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium">Corporate Health Solutions</p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Core Operations
        </div>
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600/15 text-teal-300 border border-teal-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Mini Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-white uppercase">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName}</p>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <p className="text-[10px] text-teal-400 font-medium uppercase truncate">
                {user?.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
