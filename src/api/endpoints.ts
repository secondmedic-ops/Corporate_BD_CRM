import {
  AuthResponse,
  UserDto,
  LeadDto,
  PipelineResponse,
  ColdCallDto,
  RfqDto,
  ClientDto,
  VendorDto,
  AttendanceDto,
  FieldVisitDto,
  InvoiceDto,
  OutstandingResponse,
  VendorBillDto,
  RevenueDto,
  RevenueSummaryResponse,
  ExpenseDto,
  DashboardDto,
  TeamPerformanceUserDto,
  NotificationDto,
  SettingsDto,
  AuditLogDto,
  PipelineStage,
  ApprovalStep,
  PermissionsMap,
  UserRules,
  ModuleKey,
} from '../types/api';
import { apiCall, axiosClient } from './client';
import { mockAdapter } from './mock/adapter';
import { PRESET_DEFINITIONS } from './presets';

// --- AUTH ---
export const authApi = {
  login: (email: string, password?: string): Promise<AuthResponse> =>
    apiCall(
      () => mockAdapter.login(email, password),
      async () => {
        const res = await axiosClient.post('/auth/login', { email, password });
        return res.data?.data || res.data;
      },
      'Welcome back!'
    ),

  getMe: (): Promise<UserDto> =>
    apiCall(
      () => mockAdapter.getMe(),
      async () => {
        const res = await axiosClient.get('/auth/me');
        return res.data?.data || res.data;
      }
    ),

  logout: (): Promise<void> =>
    apiCall(
      async () => {
        localStorage.removeItem('sm_crm_access_token');
        localStorage.removeItem('sm_crm_refresh_token');
      },
      async () => {
        await axiosClient.post('/auth/logout');
      },
      'Logged out successfully'
    ),
};

// --- USERS & PERMISSIONS ---
export const usersApi = {
  getUsers: (): Promise<UserDto[]> =>
    apiCall(
      () => mockAdapter.getUsers(),
      async () => {
        const res = await axiosClient.get('/users');
        return res.data?.data || res.data;
      }
    ),

  createUser: (payload: Partial<UserDto>): Promise<UserDto> =>
    apiCall(
      () => mockAdapter.createUser(payload),
      async () => {
        const res = await axiosClient.post('/users', payload);
        return res.data?.data || res.data;
      },
      'User created successfully'
    ),

  updateUser: (id: string, payload: Partial<UserDto>): Promise<UserDto> =>
    apiCall(
      () => mockAdapter.updateUser(id, payload),
      async () => {
        const res = await axiosClient.put(`/users/${id}`, payload);
        return res.data?.data || res.data;
      },
      'User details updated'
    ),

  toggleStatus: (id: string, active: boolean): Promise<UserDto> =>
    apiCall(
      () => mockAdapter.toggleUserStatus(id, active),
      async () => {
        const res = await axiosClient.patch(`/users/${id}/status`, { active });
        return res.data?.data || res.data;
      },
      `User ${active ? 'activated' : 'deactivated'}`
    ),

  updatePermissions: (id: string, permissions: PermissionsMap): Promise<UserDto> =>
    apiCall(
      () => mockAdapter.updatePermissions(id, permissions),
      async () => {
        const res = await axiosClient.put(`/users/${id}/permissions`, permissions);
        return res.data?.data || res.data;
      },
      'Permissions matrix updated'
    ),

  updateRules: (id: string, rules: UserRules): Promise<UserDto> =>
    apiCall(
      () => mockAdapter.updateRules(id, rules),
      async () => {
        const res = await axiosClient.put(`/users/${id}/rules`, rules);
        return res.data?.data || res.data;
      },
      'Manager rules updated'
    ),

  getPermissionPresets: async () => {
    return PRESET_DEFINITIONS;
  },

  getAuditLogs: (params?: { userId?: string; module?: string; from?: string; to?: string }): Promise<AuditLogDto[]> =>
    apiCall(
      () => mockAdapter.getAuditLogs(),
      async () => {
        const res = await axiosClient.get('/audit-logs', { params });
        return res.data?.data || res.data;
      }
    ),
};

// --- LEADS & PIPELINE ---
export const leadsApi = {
  getLeads: (params?: { search?: string; status?: string; stage?: string }): Promise<LeadDto[]> =>
    apiCall(
      () => mockAdapter.getLeads(params),
      async () => {
        const res = await axiosClient.get('/leads', { params });
        return res.data?.data || res.data;
      }
    ),

  getLead: (id: string): Promise<LeadDto> =>
    apiCall(
      () => mockAdapter.getLead(id),
      async () => {
        const res = await axiosClient.get(`/leads/${id}`);
        return res.data?.data || res.data;
      }
    ),

  createLead: (payload: Partial<LeadDto>): Promise<LeadDto> =>
    apiCall(
      () => mockAdapter.createLead(payload),
      async () => {
        const res = await axiosClient.post('/leads', payload);
        return res.data?.data || res.data;
      },
      'Lead captured successfully'
    ),

  updateLead: (id: string, payload: Partial<LeadDto>): Promise<LeadDto> =>
    apiCall(
      () => mockAdapter.updateLead(id, payload),
      async () => {
        const res = await axiosClient.put(`/leads/${id}`, payload);
        return res.data?.data || res.data;
      },
      'Lead updated'
    ),

  updateStage: (id: string, stage: PipelineStage, note?: string): Promise<LeadDto> =>
    apiCall(
      () => mockAdapter.updateLeadStage(id, stage, note),
      async () => {
        const res = await axiosClient.patch(`/leads/${id}/stage`, { stage, note });
        return res.data?.data || res.data;
      },
      `Stage updated to ${stage}`
    ),

  getPipeline: (): Promise<PipelineResponse> =>
    apiCall(
      () => mockAdapter.getPipeline(),
      async () => {
        const res = await axiosClient.get('/pipeline');
        return res.data?.data || res.data;
      }
    ),
};

// --- APPROVALS ---
export const approvalsApi = {
  decideStep: (leadId: string, step: ApprovalStep, decision: 'APPROVED' | 'REJECTED' | 'SENT_BACK', remarks: string): Promise<LeadDto> =>
    apiCall(
      () => mockAdapter.decideApprovalStep(leadId, step, decision, remarks),
      async () => {
        const res = await axiosClient.post(`/leads/${leadId}/approvals/${step}`, { decision, remarks });
        return res.data?.data || res.data;
      },
      `Approval step ${step} marked as ${decision}`
    ),
};

// --- COLD CALLING ---
export const coldCallingApi = {
  getColdCalls: (): Promise<ColdCallDto[]> =>
    apiCall(
      () => mockAdapter.getColdCalls(),
      async () => {
        const res = await axiosClient.get('/cold-calls');
        return res.data?.data || res.data;
      }
    ),

  createColdCall: (payload: Partial<ColdCallDto>): Promise<ColdCallDto> =>
    apiCall(
      () => mockAdapter.createColdCall(payload),
      async () => {
        const res = await axiosClient.post('/cold-calls', payload);
        return res.data?.data || res.data;
      },
      'Cold call activity recorded'
    ),

  convert: (id: string): Promise<LeadDto> =>
    apiCall(
      () => mockAdapter.convertColdCall(id),
      async () => {
        const res = await axiosClient.post(`/cold-calls/${id}/convert`);
        return res.data?.data || res.data;
      },
      'Converted to Corporate Lead'
    ),
};

// --- RFQ ---
export const rfqApi = {
  getRfqs: (): Promise<RfqDto[]> =>
    apiCall(
      () => mockAdapter.getRfqs(),
      async () => {
        const res = await axiosClient.get('/rfqs');
        return res.data?.data || res.data;
      }
    ),

  createRfq: (payload: Partial<RfqDto>): Promise<RfqDto> =>
    apiCall(
      () => mockAdapter.createRfq(payload),
      async () => {
        const res = await axiosClient.post('/rfqs', payload);
        return res.data?.data || res.data;
      },
      'RFQ created & sent to empanelled vendors'
    ),
};

// --- CLIENTS ---
export const clientsApi = {
  getClients: (): Promise<ClientDto[]> =>
    apiCall(
      () => mockAdapter.getClients(),
      async () => {
        const res = await axiosClient.get('/clients');
        return res.data?.data || res.data;
      }
    ),

  createClient: (payload: Partial<ClientDto>): Promise<ClientDto> =>
    apiCall(
      () => mockAdapter.createClient(payload),
      async () => {
        const res = await axiosClient.post('/clients', payload);
        return res.data?.data || res.data;
      },
      'Client onboarded successfully'
    ),
};

// --- VENDORS ---
export const vendorsApi = {
  getVendors: (): Promise<VendorDto[]> =>
    apiCall(
      () => mockAdapter.getVendors(),
      async () => {
        const res = await axiosClient.get('/vendors');
        return res.data?.data || res.data;
      }
    ),

  empanelVendor: (id: string): Promise<VendorDto> =>
    apiCall(
      () => mockAdapter.empanelVendor(id),
      async () => {
        const res = await axiosClient.patch(`/vendors/${id}/status`, { status: 'EMPANELLED' });
        return res.data?.data || res.data;
      },
      'Vendor successfully empanelled'
    ),
};

// --- ATTENDANCE & FIELD VISITS ---
export const attendanceApi = {
  getAttendance: (): Promise<AttendanceDto[]> =>
    apiCall(
      () => mockAdapter.getAttendance(),
      async () => {
        const res = await axiosClient.get('/attendance');
        return res.data?.data || res.data;
      }
    ),

  checkIn: (lat: number | null, lng: number | null, label?: string): Promise<AttendanceDto> =>
    apiCall(
      () => mockAdapter.checkIn(lat, lng, label),
      async () => {
        const res = await axiosClient.post('/attendance/check-in', { latitude: lat, longitude: lng, locationLabel: label });
        return res.data?.data || res.data;
      },
      'Checked in successfully'
    ),

  checkOut: (lat: number | null, lng: number | null, label?: string): Promise<AttendanceDto> =>
    apiCall(
      () => mockAdapter.checkOut(lat, lng, label),
      async () => {
        const res = await axiosClient.post('/attendance/check-out', { latitude: lat, longitude: lng, locationLabel: label });
        return res.data?.data || res.data;
      },
      'Checked out successfully'
    ),
};

export const fieldVisitsApi = {
  getFieldVisits: (): Promise<FieldVisitDto[]> =>
    apiCall(
      () => mockAdapter.getFieldVisits(),
      async () => {
        const res = await axiosClient.get('/field-visits');
        return res.data?.data || res.data;
      }
    ),

  startVisit: (payload: Partial<FieldVisitDto>): Promise<FieldVisitDto> =>
    apiCall(
      () => mockAdapter.startFieldVisit(payload),
      async () => {
        const res = await axiosClient.post('/field-visits', payload);
        return res.data?.data || res.data;
      },
      'Field visit started'
    ),

  endVisit: (id: string, outcomeNotes: string, lat?: number, lng?: number, label?: string): Promise<FieldVisitDto> =>
    apiCall(
      () => mockAdapter.endFieldVisit(id, outcomeNotes, lat, lng, label),
      async () => {
        const res = await axiosClient.post(`/field-visits/${id}/end`, { outcomeNotes, latitude: lat, longitude: lng, locationLabel: label });
        return res.data?.data || res.data;
      },
      'Field visit completed & notes logged'
    ),
};

// --- INVOICES & OUTSTANDING ---
export const invoicesApi = {
  getInvoices: (): Promise<InvoiceDto[]> =>
    apiCall(
      () => mockAdapter.getInvoices(),
      async () => {
        const res = await axiosClient.get('/invoices');
        return res.data?.data || res.data;
      }
    ),

  createInvoice: (payload: Partial<InvoiceDto>): Promise<InvoiceDto> =>
    apiCall(
      () => mockAdapter.createInvoice(payload),
      async () => {
        const res = await axiosClient.post('/invoices', payload);
        return res.data?.data || res.data;
      },
      'Invoice created in DRAFT'
    ),

  recordPayment: (id: string, amount: number, paymentMode: any, reference: string): Promise<InvoiceDto> =>
    apiCall(
      () => mockAdapter.recordInvoicePayment(id, amount, paymentMode, reference),
      async () => {
        const res = await axiosClient.post(`/invoices/${id}/payments`, { amount, paymentMode, reference });
        return res.data?.data || res.data;
      },
      'Payment recorded successfully'
    ),
};

// --- VENDOR BILLS ---
export const vendorBillsApi = {
  getBills: (): Promise<VendorBillDto[]> =>
    apiCall(
      () => mockAdapter.getVendorBills(),
      async () => {
        const res = await axiosClient.get('/vendor-bills');
        return res.data?.data || res.data;
      }
    ),

  createBill: (payload: Partial<VendorBillDto>): Promise<VendorBillDto> =>
    apiCall(
      () => mockAdapter.createVendorBill(payload),
      async () => {
        const res = await axiosClient.post('/vendor-bills', payload);
        return res.data?.data || res.data;
      },
      'Vendor bill registered'
    ),

  recordPayment: (id: string, amount: number, paymentMode: any, reference: string): Promise<VendorBillDto> =>
    apiCall(
      () => mockAdapter.recordVendorBillPayment(id, amount, paymentMode, reference),
      async () => {
        const res = await axiosClient.post(`/vendor-bills/${id}/payments`, { amount, paymentMode, reference });
        return res.data?.data || res.data;
      },
      'Vendor payment recorded'
    ),
};

// --- REVENUE ---
export const revenueApi = {
  getRevenues: (): Promise<RevenueDto[]> =>
    apiCall(
      () => mockAdapter.getRevenues(),
      async () => {
        const res = await axiosClient.get('/revenue');
        return res.data?.data || res.data;
      }
    ),

  createRevenue: (payload: Partial<RevenueDto>): Promise<RevenueDto> =>
    apiCall(
      () => mockAdapter.createRevenue(payload),
      async () => {
        const res = await axiosClient.post('/revenue', payload);
        return res.data?.data || res.data;
      },
      'Revenue entry logged'
    ),
};

// --- EXPENSES ---
export const expensesApi = {
  getExpenses: (): Promise<ExpenseDto[]> =>
    apiCall(
      () => mockAdapter.getExpenses(),
      async () => {
        const res = await axiosClient.get('/expenses');
        return res.data?.data || res.data;
      }
    ),

  submitExpense: (payload: Partial<ExpenseDto>): Promise<ExpenseDto> =>
    apiCall(
      () => mockAdapter.submitExpense(payload),
      async () => {
        const res = await axiosClient.post('/expenses', payload);
        return res.data?.data || res.data;
      },
      'Expense claim submitted for approval'
    ),

  decideExpense: (id: string, decision: 'APPROVED' | 'REJECTED', remarks: string): Promise<ExpenseDto> =>
    apiCall(
      () => mockAdapter.decideExpense(id, decision, remarks),
      async () => {
        const res = await axiosClient.patch(`/expenses/${id}/decision`, { decision, remarks });
        return res.data?.data || res.data;
      },
      `Expense marked as ${decision}`
    ),

  reimburseExpense: (id: string, paymentMode: any, reference: string): Promise<ExpenseDto> =>
    apiCall(
      () => mockAdapter.reimburseExpense(id, paymentMode, reference),
      async () => {
        const res = await axiosClient.patch(`/expenses/${id}/reimburse`, { paymentMode, reference });
        return res.data?.data || res.data;
      },
      'Expense reimbursed'
    ),
};

// --- DASHBOARD & TEAM ---
export const dashboardApi = {
  getDashboard: (): Promise<DashboardDto> =>
    apiCall(
      () => mockAdapter.getDashboard(),
      async () => {
        const res = await axiosClient.get('/dashboard');
        return res.data?.data || res.data;
      }
    ),
};

export const teamApi = {
  getPerformance: (): Promise<TeamPerformanceUserDto[]> =>
    apiCall(
      () => mockAdapter.getTeamPerformance(),
      async () => {
        const res = await axiosClient.get('/team/performance');
        return res.data?.data || res.data;
      }
    ),
};

// --- NOTIFICATIONS & SETTINGS ---
export const notificationsApi = {
  getNotifications: (): Promise<NotificationDto[]> =>
    apiCall(
      () => mockAdapter.getNotifications(),
      async () => {
        const res = await axiosClient.get('/notifications');
        return res.data?.data || res.data;
      }
    ),

  markRead: (id: string): Promise<boolean> =>
    apiCall(
      () => mockAdapter.markNotificationRead(id),
      async () => {
        await axiosClient.patch(`/notifications/${id}/read`);
        return true;
      }
    ),

  markAllRead: (): Promise<boolean> =>
    apiCall(
      () => mockAdapter.markAllNotificationsRead(),
      async () => {
        await axiosClient.patch('/notifications/read-all');
        return true;
      },
      'All notifications marked as read'
    ),
};

export const settingsApi = {
  getSettings: (): Promise<SettingsDto> =>
    apiCall(
      () => mockAdapter.getSettings(),
      async () => {
        const res = await axiosClient.get('/settings');
        return res.data?.data || res.data;
      }
    ),

  updateSettings: (payload: Partial<SettingsDto>): Promise<SettingsDto> =>
    apiCall(
      () => mockAdapter.updateSettings(payload),
      async () => {
        const res = await axiosClient.put('/settings', payload);
        return res.data?.data || res.data;
      },
      'Settings saved'
    ),
};
