import { ModuleKey, ModulePermission, PermissionsMap, UserRules } from '../types/api';

export const ALL_MODULE_KEYS: ModuleKey[] = [
  'dashboard',
  'leads',
  'pipeline',
  'approvals',
  'cold_calling',
  'rfq',
  'clients',
  'attendance',
  'field_visits',
  'vendors',
  'vendor_payments',
  'invoices',
  'outstanding',
  'revenue',
  'expenses',
  'team',
  'settings',
  'notifications',
];

export const createEmptyPermissions = (): PermissionsMap => {
  const perm: Partial<PermissionsMap> = {};
  for (const m of ALL_MODULE_KEYS) {
    perm[m] = {
      view: false,
      create: false,
      edit: false,
      delete: false,
      approve: false,
      export: false,
      scope: 'OWN',
    };
  }
  return perm as PermissionsMap;
};

export const createSuperManagerPermissions = (): PermissionsMap => {
  const perm: Partial<PermissionsMap> = {};
  for (const m of ALL_MODULE_KEYS) {
    perm[m] = {
      view: true,
      create: true,
      edit: true,
      delete: true,
      approve: true,
      export: true,
      scope: 'ALL',
    };
  }
  return perm as PermissionsMap;
};

export const buildCustomPermissions = (base?: Partial<PermissionsMap>): PermissionsMap => {
  const perm = createEmptyPermissions();
  if (base) {
    for (const key of Object.keys(base) as ModuleKey[]) {
      if (base[key]) {
        perm[key] = { ...perm[key], ...base[key] };
      }
    }
  }
  return perm;
};

export const PRESET_DEFINITIONS: Record<
  string,
  { label: string; name?: string; permissions: PermissionsMap; rules: Partial<UserRules> }
> = {
  BD_EXECUTIVE: {
    label: 'BD Executive',
    name: 'BD Executive',
    permissions: (() => {
      const p = createEmptyPermissions();
      const ownSales: ModuleKey[] = ['leads', 'pipeline', 'cold_calling', 'rfq', 'attendance', 'field_visits', 'expenses'];
      for (const m of ownSales) {
        p[m] = { view: true, create: true, edit: true, delete: false, approve: false, export: false, scope: 'OWN' };
      }
      p.dashboard = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'OWN' };
      p.clients = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'TEAM' };
      p.notifications = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'OWN' };
      p.approvals = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'OWN' };
      return p;
    })(),
    rules: {
      editWindowHours: 24,
      lockAfterApprovalStarts: true,
      maxLeadValueWithoutApproval: 100000,
      maxDiscountPercent: 10,
      maxExpenseAmount: 5000,
      requireGpsForFieldVisit: true,
      canExportData: false,
      allowedLeadSources: ['COLD_CALL', 'REFERRAL', 'INBOUND'],
      restrictedFields: ['expectedValue', 'quoteStatus'],
      workingHoursOnly: false,
    },
  },
  OPS_EXECUTIVE: {
    label: 'Operations Executive',
    name: 'Operations Executive',
    permissions: (() => {
      const p = createEmptyPermissions();
      const opsModules: ModuleKey[] = ['clients', 'vendors', 'attendance', 'field_visits', 'rfq'];
      for (const m of opsModules) {
        p[m] = { view: true, create: true, edit: true, delete: false, approve: false, export: false, scope: 'TEAM' };
      }
      p.dashboard = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'TEAM' };
      p.pipeline = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'TEAM' };
      p.approvals = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'TEAM' };
      p.notifications = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'TEAM' };
      p.expenses = { view: true, create: true, edit: true, delete: false, approve: false, export: false, scope: 'OWN' };
      return p;
    })(),
    rules: {
      editWindowHours: 48,
      lockAfterApprovalStarts: true,
      maxLeadValueWithoutApproval: 150000,
      maxDiscountPercent: 15,
      maxExpenseAmount: 7000,
      requireGpsForFieldVisit: true,
      canExportData: false,
      allowedLeadSources: ['COLD_CALL', 'REFERRAL', 'PARTNER'],
      restrictedFields: ['rateCardValidTo'],
      workingHoursOnly: false,
    },
  },
  FINANCE_EXECUTIVE: {
    label: 'Finance Executive',
    name: 'Finance Executive',
    permissions: (() => {
      const p = createEmptyPermissions();
      const finModules: ModuleKey[] = ['invoices', 'outstanding', 'vendor_payments', 'revenue', 'expenses'];
      for (const m of finModules) {
        p[m] = { view: true, create: true, edit: true, delete: false, approve: false, export: true, scope: 'TEAM' };
      }
      p.dashboard = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'TEAM' };
      p.clients = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'ALL' };
      p.vendors = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'ALL' };
      p.attendance = { view: true, create: true, edit: false, delete: false, approve: false, export: false, scope: 'OWN' };
      p.notifications = { view: true, create: false, edit: false, delete: false, approve: false, export: false, scope: 'TEAM' };
      return p;
    })(),
    rules: {
      editWindowHours: 72,
      lockAfterApprovalStarts: true,
      maxLeadValueWithoutApproval: 200000,
      maxDiscountPercent: 15,
      maxExpenseAmount: 15000,
      requireGpsForFieldVisit: false,
      canExportData: true,
      allowedLeadSources: ['REFERRAL', 'EXISTING_CLIENT_UPSELL'],
      restrictedFields: ['taxAmount'],
      workingHoursOnly: false,
    },
  },
  READ_ONLY_AUDITOR: {
    label: 'Read-Only Auditor',
    name: 'Read-Only Auditor',
    permissions: (() => {
      const p = createEmptyPermissions();
      for (const m of ALL_MODULE_KEYS) {
        p[m] = { view: true, create: false, edit: false, delete: false, approve: false, export: true, scope: 'ALL' };
      }
      return p;
    })(),
    rules: {
      editWindowHours: 0,
      lockAfterApprovalStarts: true,
      maxLeadValueWithoutApproval: 0,
      maxDiscountPercent: 0,
      maxExpenseAmount: 0,
      requireGpsForFieldVisit: false,
      canExportData: true,
      allowedLeadSources: ['COLD_CALL', 'REFERRAL', 'INBOUND', 'EVENT', 'EXISTING_CLIENT_UPSELL', 'PARTNER', 'OTHER'],
      restrictedFields: [],
      workingHoursOnly: false,
    },
  },
};
