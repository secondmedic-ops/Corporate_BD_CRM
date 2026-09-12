import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { usersApi } from '../../api/endpoints';
import {
  UserDto,
  AuditLogDto,
  UserRole,
  Department,
  PermissionsMap,
  UserRules,
  ModuleKey,
  PermissionAction,
  DataScope,
} from '../../types/api';
import {
  Shield,
  UserPlus,
  Edit2,
  Sliders,
  History,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Search,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { toast } from '../../utils/errors';
import { PRESET_DEFINITIONS, buildCustomPermissions } from '../../api/presets';

const ALL_MODULES: { key: ModuleKey; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'pipeline', label: 'Pipeline' },
  { key: 'leads', label: 'Leads' },
  { key: 'cold_calling', label: 'Cold Calling' },
  { key: 'rfq', label: 'RFQ & Quotes' },
  { key: 'approvals', label: '7-Step Approvals' },
  { key: 'clients', label: 'Corporate Clients' },
  { key: 'vendors', label: 'Empanelled Vendors' },
  { key: 'attendance', label: 'Attendance & Punch' },
  { key: 'field_visits', label: 'Field Visits & GPS' },
  { key: 'invoices', label: 'Invoices & Billing' },
  { key: 'vendor_payments', label: 'Vendor Payments' },
  { key: 'revenue', label: 'Revenue Tracker' },
  { key: 'expenses', label: 'Expense Claims' },
  { key: 'team', label: 'Team Performance' },
];

const ACTIONS: PermissionAction[] = ['view', 'create', 'edit', 'delete', 'approve', 'export'];

interface UsersPageProps {
  initialTab?: 'users' | 'audit';
}

export const UsersPage: React.FC<UsersPageProps> = ({ initialTab = 'users' }) => {
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'audit'>(initialTab);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected user for editing
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState<'details' | 'permissions' | 'rules'>('permissions');

  // New user form state
  const [newUserForm, setNewUserForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    role: 'STAFF' as UserRole,
    department: currentUser?.department || 'SALES_BD',
    territory: 'Mumbai Central',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [uList, logs] = await Promise.all([
        usersApi.getUsers(),
        currentUser?.role === 'SUPER_MANAGER' ? usersApi.getAuditLogs() : Promise.resolve([]),
      ]);
      setUsers(uList);
      setAuditLogs(logs);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleToggleStatus = async (user: UserDto) => {
    try {
      await usersApi.toggleStatus(user.id, !user.active);
      loadData();
    } catch {
      // handled
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await usersApi.createUser(newUserForm);
      setShowCreateModal(false);
      setNewUserForm({
        fullName: '',
        email: '',
        phone: '',
        role: 'STAFF',
        department: currentUser?.department || 'SALES_BD',
        territory: 'Mumbai Central',
      });
      loadData();
    } catch {
      // handled
    }
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.updatePermissions(selectedUser.id, selectedUser.permissions);
      loadData();
      toast.success('Permissions matrix saved');
    } catch {
      // handled
    }
  };

  const handleSaveRules = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.updateRules(selectedUser.id, selectedUser.rules);
      loadData();
      toast.success('Manager rules applied');
    } catch {
      // handled
    }
  };

  const handleApplyPreset = (presetKey: string) => {
    if (!selectedUser) return;
    const preset = PRESET_DEFINITIONS[presetKey];
    if (!preset) return;
    setSelectedUser({
      ...selectedUser,
      permissions: preset.permissions,
      rules: { ...selectedUser.rules, ...preset.rules },
    });
    toast.info(`Applied preset: ${preset.label || preset.name}`);
  };

  const handleTogglePermission = (module: ModuleKey, action: PermissionAction) => {
    if (!selectedUser) return;
    const currMod = selectedUser.permissions[module] || {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: false,
      scope: 'OWN',
    };

    const updated = {
      ...selectedUser.permissions,
      [module]: {
        ...currMod,
        [action]: !currMod[action],
      },
    };
    setSelectedUser({ ...selectedUser, permissions: updated });
  };

  const handleScopeChange = (module: ModuleKey, scope: DataScope) => {
    if (!selectedUser) return;
    const currMod = selectedUser.permissions[module] || {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: false,
      scope: 'OWN',
    };

    const updated = {
      ...selectedUser.permissions,
      [module]: {
        ...currMod,
        scope,
      },
    };
    setSelectedUser({ ...selectedUser, permissions: updated });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.department.toLowerCase().includes(search.toLowerCase())
  );

  const activeManagersCount = users.filter((u) => u.role === 'MANAGER' && u.active).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Shield className="w-5 h-5 text-teal-600" />
            Users & RBAC Permissions
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee access control, per-module action grants, data scopes, and business rule limits.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentUser?.role === 'SUPER_MANAGER' && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'users' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Team Directory
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'audit' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                }`}
              >
                Audit Log
              </button>
            </div>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="space-y-4">
          {/* Manager Cap Notification if Super Manager */}
          {currentUser?.role === 'SUPER_MANAGER' && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs text-teal-900">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-600" />
                <span>
                  <strong>Manager Hard Cap Enforcement:</strong> Current active Department Managers:{' '}
                  <span className="font-bold text-teal-700">{activeManagersCount} / 3</span>
                </span>
              </div>
              <span className="text-[11px] text-teal-700">
                (Strict corporate constraint: maximum 3 active manager accounts allowed)
              </span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, or department..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Employee</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Territory</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs">
                          {u.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.fullName}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          u.role === 'SUPER_MANAGER'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : u.role === 'MANAGER'
                            ? 'bg-teal-50 text-teal-700 border border-teal-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 font-medium">
                      {u.department.replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500">{u.territory}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={u.role === 'SUPER_MANAGER'}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          u.active
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-red-50 text-red-700 hover:bg-red-100'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-red-600" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(u);
                          setEditModalTab('permissions');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Configure RBAC</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Audit Log Table */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <History className="w-4 h-4 text-teal-600" /> System Audit Trail
            </h2>
            <span className="text-xs text-slate-500">Immutable governance log</span>
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Entity ID</th>
                <th className="px-5 py-3">Payload Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-sans font-semibold text-slate-800">
                    {log.actorName}
                  </td>
                  <td className="px-4 py-3 font-sans">
                    <span className="px-1.5 py-0.5 bg-slate-100 text-slate-800 rounded font-medium text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-sans text-teal-700 uppercase font-semibold">
                    {log.module}
                  </td>
                  <td className="px-4 py-3 text-slate-500">{log.entityId}</td>
                  <td className="px-5 py-3 text-slate-600 max-w-xs truncate">
                    {log.newValue ? JSON.stringify(log.newValue) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* RBAC Configuration Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  Configure Access: {selectedUser.fullName}
                </h3>
                <p className="text-xs text-slate-500">
                  Role: {selectedUser.role} • Dept: {selectedUser.department}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Sub-tabs */}
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditModalTab('permissions')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                    editModalTab === 'permissions' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Permissions Matrix
                </button>
                <button
                  onClick={() => setEditModalTab('rules')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg ${
                    editModalTab === 'rules' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Manager Rule Enforcement
                </button>
              </div>

              {/* Preset buttons */}
              {editModalTab === 'permissions' && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 font-medium">Apply Preset:</span>
                  {(['BD_EXECUTIVE', 'OPS_EXECUTIVE', 'FINANCE_EXECUTIVE', 'READ_ONLY_AUDITOR'] as const).map((pk) => (
                    <button
                      key={pk}
                      onClick={() => handleApplyPreset(pk)}
                      className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 hover:bg-teal-50 hover:text-teal-700 rounded border transition-colors"
                    >
                      {PRESET_DEFINITIONS[pk]?.label || pk}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto pr-1">
              {editModalTab === 'permissions' ? (
                <div className="space-y-3">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold sticky top-0">
                      <tr>
                        <th className="py-2.5 px-3">Module</th>
                        <th className="py-2.5 px-2 text-center">View</th>
                        <th className="py-2.5 px-2 text-center">Create</th>
                        <th className="py-2.5 px-2 text-center">Edit</th>
                        <th className="py-2.5 px-2 text-center">Delete</th>
                        <th className="py-2.5 px-2 text-center">Approve</th>
                        <th className="py-2.5 px-2 text-center">Export</th>
                        <th className="py-2.5 px-3 text-center">Data Scope</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ALL_MODULES.map(({ key, label }) => {
                        const perm = selectedUser.permissions[key] || {
                          view: false,
                          create: false,
                          edit: false,
                          delete: false,
                          approve: false,
                          export: false,
                          scope: 'OWN',
                        };

                        return (
                          <tr key={key} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-700">{label}</td>
                            {ACTIONS.map((action) => (
                              <td key={action} className="py-2 px-2 text-center">
                                <input
                                  type="checkbox"
                                  checked={Boolean(perm[action])}
                                  onChange={() => handleTogglePermission(key, action)}
                                  className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                                />
                              </td>
                            ))}
                            <td className="py-2 px-3 text-center">
                              <select
                                value={perm.scope || 'OWN'}
                                onChange={(e) => handleScopeChange(key, e.target.value as DataScope)}
                                className="text-xs px-2 py-1 bg-slate-50 border rounded font-semibold text-slate-700"
                              >
                                <option value="OWN">OWN</option>
                                <option value="TEAM">TEAM</option>
                                <option value="ALL">ALL</option>
                              </select>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Manager Rules Tab */
                <div className="space-y-4 p-2 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Max Lead Value Without Approval (₹)
                      </label>
                      <input
                        type="number"
                        value={selectedUser.rules.maxLeadValueWithoutApproval}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            rules: {
                              ...selectedUser.rules,
                              maxLeadValueWithoutApproval: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Exceeding this value blocks moving stage forward past L2_QUALIFIED.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Max Allowed Discount (%)
                      </label>
                      <input
                        type="number"
                        value={selectedUser.rules.maxDiscountPercent}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            rules: {
                              ...selectedUser.rules,
                              maxDiscountPercent: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Applies during RFQ pricing and quotation generation.
                      </p>
                    </div>

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        Max Expense Claim Route (₹)
                      </label>
                      <input
                        type="number"
                        value={selectedUser.rules.maxExpenseAmount}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            rules: {
                              ...selectedUser.rules,
                              maxExpenseAmount: Number(e.target.value),
                            },
                          })
                        }
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Claims above this automatically route to Super Manager.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <input
                        type="checkbox"
                        id="gpsRule"
                        checked={selectedUser.rules.requireGpsForFieldVisit}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            rules: {
                              ...selectedUser.rules,
                              requireGpsForFieldVisit: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-teal-600"
                      />
                      <label htmlFor="gpsRule" className="text-slate-700 font-semibold cursor-pointer">
                        Enforce GPS Location on Field Visits
                      </label>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="lockRule"
                        checked={selectedUser.rules.lockAfterApprovalStarts}
                        onChange={(e) =>
                          setSelectedUser({
                            ...selectedUser,
                            rules: {
                              ...selectedUser.rules,
                              lockAfterApprovalStarts: e.target.checked,
                            },
                          })
                        }
                        className="rounded text-teal-600"
                      />
                      <label htmlFor="lockRule" className="text-slate-700 font-semibold cursor-pointer">
                        Lock Lead Fields Once Approval Workflow Begins
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={editModalTab === 'permissions' ? handleSavePermissions : handleSaveRules}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-800">Add Team Member</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Full Name</label>
                <input
                  required
                  value={newUserForm.fullName}
                  onChange={(e) => setNewUserForm({ ...newUserForm, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Kulkarni"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  placeholder="ramesh@secondmedic.com"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Phone</label>
                <input
                  required
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="9876543210"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Role</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="STAFF">STAFF</option>
                  {currentUser?.role === 'SUPER_MANAGER' && (
                    <>
                      <option value="MANAGER">DEPARTMENT MANAGER</option>
                      <option value="SUPER_MANAGER">SUPER MANAGER</option>
                    </>
                  )}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Department</label>
                <select
                  value={newUserForm.department}
                  disabled={currentUser?.role === 'MANAGER'}
                  onChange={(e) => setNewUserForm({ ...newUserForm, department: e.target.value as Department })}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="SALES_BD">SALES_BD</option>
                  <option value="OPERATIONS">OPERATIONS</option>
                  <option value="FINANCE">FINANCE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Territory</label>
                <input
                  required
                  value={newUserForm.territory}
                  onChange={(e) => setNewUserForm({ ...newUserForm, territory: e.target.value })}
                  placeholder="e.g. Pune & Western Maharashtra"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-lg font-semibold"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
