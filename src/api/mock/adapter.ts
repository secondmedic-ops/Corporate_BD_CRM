import {
  UserDto,
  LeadDto,
  PipelineResponse,
  PipelineStageSummary,
  ColdCallDto,
  RfqDto,
  ClientDto,
  VendorDto,
  AttendanceDto,
  FieldVisitDto,
  InvoiceDto,
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
  ErrorCode,
  DataScope,
  ModuleKey,
} from '../../types/api';
import { AppError } from '../../utils/errors';
import { SEED_USERS, INITIAL_SETTINGS } from './seedData';
import {
  SEED_LEADS,
  SEED_CLIENTS,
  SEED_VENDORS,
  SEED_INVOICES,
  SEED_COLD_CALLS,
  SEED_RFQS,
  SEED_ATTENDANCE,
  SEED_FIELD_VISITS,
  SEED_VENDOR_BILLS,
  SEED_REVENUES,
  SEED_EXPENSES,
  SEED_NOTIFICATIONS,
  SEED_AUDIT_LOGS,
} from './seedEntities';

class MockStorage {
  private get<T>(key: string, fallback: T): T {
    try {
      const val = localStorage.getItem(`sm_crm_${key}`);
      return val ? JSON.parse(val) : fallback;
    } catch {
      return fallback;
    }
  }

  private set<T>(key: string, data: T) {
    try {
      localStorage.setItem(`sm_crm_${key}`, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage quota exceeded or error:', e);
    }
  }

  get users(): UserDto[] { return this.get('users', SEED_USERS); }
  set users(data: UserDto[]) { this.set('users', data); }

  get leads(): LeadDto[] { return this.get('leads', SEED_LEADS); }
  set leads(data: LeadDto[]) { this.set('leads', data); }

  get clients(): ClientDto[] { return this.get('clients', SEED_CLIENTS); }
  set clients(data: ClientDto[]) { this.set('clients', data); }

  get vendors(): VendorDto[] { return this.get('vendors', SEED_VENDORS); }
  set vendors(data: VendorDto[]) { this.set('vendors', data); }

  get invoices(): InvoiceDto[] { return this.get('invoices', SEED_INVOICES); }
  set invoices(data: InvoiceDto[]) { this.set('invoices', data); }

  get vendorBills(): VendorBillDto[] { return this.get('vendorBills', SEED_VENDOR_BILLS); }
  set vendorBills(data: VendorBillDto[]) { this.set('vendorBills', data); }

  get revenues(): RevenueDto[] { return this.get('revenues', SEED_REVENUES); }
  set revenues(data: RevenueDto[]) { this.set('revenues', data); }

  get expenses(): ExpenseDto[] { return this.get('expenses', SEED_EXPENSES); }
  set expenses(data: ExpenseDto[]) { this.set('expenses', data); }

  get coldCalls(): ColdCallDto[] { return this.get('coldCalls', SEED_COLD_CALLS); }
  set coldCalls(data: ColdCallDto[]) { this.set('coldCalls', data); }

  get rfqs(): RfqDto[] { return this.get('rfqs', SEED_RFQS); }
  set rfqs(data: RfqDto[]) { this.set('rfqs', data); }

  get attendance(): AttendanceDto[] { return this.get('attendance', SEED_ATTENDANCE); }
  set attendance(data: AttendanceDto[]) { this.set('attendance', data); }

  get fieldVisits(): FieldVisitDto[] { return this.get('fieldVisits', SEED_FIELD_VISITS); }
  set fieldVisits(data: FieldVisitDto[]) { this.set('fieldVisits', data); }

  get notifications(): NotificationDto[] { return this.get('notifications', SEED_NOTIFICATIONS); }
  set notifications(data: NotificationDto[]) { this.set('notifications', data); }

  get settings(): SettingsDto { return this.get('settings', INITIAL_SETTINGS); }
  set settings(data: SettingsDto) { this.set('settings', data); }

  get auditLogs(): AuditLogDto[] { return this.get('auditLogs', SEED_AUDIT_LOGS); }
  set auditLogs(data: AuditLogDto[]) { this.set('auditLogs', data); }

  resetAll() {
    localStorage.removeItem('sm_crm_users');
    localStorage.removeItem('sm_crm_leads');
    localStorage.removeItem('sm_crm_clients');
    localStorage.removeItem('sm_crm_vendors');
    localStorage.removeItem('sm_crm_invoices');
    localStorage.removeItem('sm_crm_vendorBills');
    localStorage.removeItem('sm_crm_revenues');
    localStorage.removeItem('sm_crm_expenses');
    localStorage.removeItem('sm_crm_coldCalls');
    localStorage.removeItem('sm_crm_rfqs');
    localStorage.removeItem('sm_crm_attendance');
    localStorage.removeItem('sm_crm_fieldVisits');
    localStorage.removeItem('sm_crm_notifications');
    localStorage.removeItem('sm_crm_settings');
    localStorage.removeItem('sm_crm_auditLogs');
  }
}

export const db = new MockStorage();

export class MockAdapter {
  private currentUser: UserDto = SEED_USERS[0]; // defaults to Ravi Prakash Namdeo

  setCurrentUser(user: UserDto) {
    this.currentUser = user;
  }

  getCurrentUser(): UserDto {
    const refreshed = db.users.find((u) => u.id === this.currentUser.id);
    if (refreshed) {
      this.currentUser = refreshed;
    }
    return this.currentUser;
  }

  private audit(action: string, module: ModuleKey, entityId: string, oldValue: Record<string, unknown> | null, newValue: Record<string, unknown> | null, targetUserId?: string) {
    const log: AuditLogDto = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      actorId: this.currentUser.id,
      actorName: this.currentUser.fullName,
      action,
      module,
      entityId,
      targetUserId,
      oldValue,
      newValue,
      ipAddress: '127.0.0.1 (Mock)',
      createdAt: new Date().toISOString(),
    };
    db.auditLogs = [log, ...db.auditLogs];
  }

  private filterByScope<T extends Record<string, any>>(items: T[], module: ModuleKey): T[] {
    if (this.currentUser.role === 'SUPER_MANAGER') return items;
    const perm = this.currentUser.permissions[module];
    if (!perm || !perm.view) return [];

    const scope: DataScope = perm.scope || 'OWN';
    if (scope === 'ALL') return items;

    return items.filter((item) => {
      const owner = item.ownerId || item.userId || item.staffId;
      if (scope === 'OWN') {
        return owner === this.currentUser.id;
      }
      if (scope === 'TEAM') {
        if (owner === this.currentUser.id) return true;
        const ownerUser = db.users.find((u) => u.id === owner);
        return ownerUser?.department === this.currentUser.department;
      }
      return true;
    });
  }

  // --- AUTH ---
  async login(email: string, password?: string) {
    const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      throw new AppError({ code: 'UNAUTHENTICATED', message: 'Invalid email or password' });
    }
    if (!user.active) {
      throw new AppError({ code: 'PERMISSION_DENIED', message: 'Account is deactivated. Please contact Super Manager.' });
    }
    this.currentUser = user;
    return {
      accessToken: `mock-access-token-${user.id}-${Date.now()}`,
      refreshToken: `mock-refresh-token-${user.id}`,
      expiresIn: 1800,
      user,
    };
  }

  async getMe() {
    return this.getCurrentUser();
  }

  // --- USERS & PERMISSIONS ---
  async getUsers() {
    const users = db.users;
    if (this.currentUser.role === 'SUPER_MANAGER') return users;
    if (this.currentUser.role === 'MANAGER') {
      return users.filter((u) => u.department === this.currentUser.department && u.role === 'STAFF');
    }
    return users.filter((u) => u.id === this.currentUser.id);
  }

  async createUser(payload: Partial<UserDto>) {
    const users = db.users;
    if (this.currentUser.role === 'MANAGER') {
      if (payload.role === 'MANAGER' || payload.role === 'SUPER_MANAGER') {
        throw new AppError({ code: 'PERMISSION_DENIED', message: 'Managers can only create STAFF members in their own department' });
      }
      payload.department = this.currentUser.department;
      payload.managerId = this.currentUser.id;
    } else if (this.currentUser.role === 'SUPER_MANAGER') {
      if (payload.role === 'MANAGER') {
        const activeManagers = users.filter((u) => u.role === 'MANAGER' && u.active);
        if (activeManagers.length >= 3) {
          throw new AppError({ code: 'MANAGER_LIMIT_REACHED', message: 'Hard cap of 3 ACTIVE Manager accounts reached.' });
        }
      }
    }

    const newUser: UserDto = {
      id: `u-${Date.now()}`,
      fullName: payload.fullName || 'New User',
      email: payload.email || '',
      phone: payload.phone || '',
      role: payload.role || 'STAFF',
      department: payload.department || this.currentUser.department,
      territory: payload.territory || 'Assigned Territory',
      managerId: payload.managerId || this.currentUser.id,
      active: true,
      permissions: payload.permissions || this.currentUser.permissions,
      rules: payload.rules || this.currentUser.rules,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.users = [...users, newUser];
    this.audit('USER_CREATED', 'team', newUser.id, null, { email: newUser.email, role: newUser.role });
    return newUser;
  }

  async updateUser(id: string, payload: Partial<UserDto>) {
    const users = db.users;
    const target = users.find((u) => u.id === id);
    if (!target) throw new AppError({ code: 'NOT_FOUND', message: 'User not found' });

    if (this.currentUser.role === 'MANAGER') {
      if (target.role !== 'STAFF' || target.department !== this.currentUser.department) {
        throw new AppError({ code: 'PERMISSION_DENIED', message: 'You can only edit staff in your department' });
      }
    }

    const updated = { ...target, ...payload, updatedAt: new Date().toISOString() };
    db.users = users.map((u) => (u.id === id ? updated : u));
    this.audit('USER_UPDATED', 'team', id, { name: target.fullName }, { name: updated.fullName });
    return updated;
  }

  async toggleUserStatus(id: string, active: boolean) {
    const users = db.users;
    const target = users.find((u) => u.id === id);
    if (!target) throw new AppError({ code: 'NOT_FOUND', message: 'User not found' });

    if (target.role === 'SUPER_MANAGER') {
      throw new AppError({ code: 'PERMISSION_DENIED', message: 'Super Manager account cannot be deactivated' });
    }

    if (active && target.role === 'MANAGER') {
      const activeManagers = users.filter((u) => u.role === 'MANAGER' && u.active && u.id !== id);
      if (activeManagers.length >= 3) {
        throw new AppError({ code: 'MANAGER_LIMIT_REACHED', message: 'Cannot activate manager: Maximum 3 active managers allowed.' });
      }
    }

    const updated = { ...target, active, updatedAt: new Date().toISOString() };
    db.users = users.map((u) => (u.id === id ? updated : u));
    this.audit('USER_STATUS_CHANGED', 'team', id, { active: target.active }, { active });
    return updated;
  }

  async updatePermissions(id: string, permissions: PermissionsMap) {
    if (this.currentUser.id === id) {
      throw new AppError({ code: 'PERMISSION_DENIED', message: 'Nobody can edit their own permissions' });
    }
    const users = db.users;
    const target = users.find((u) => u.id === id);
    if (!target) throw new AppError({ code: 'NOT_FOUND', message: 'User not found' });

    if (this.currentUser.role === 'MANAGER') {
      // Validate manager does not grant permissions they don't hold
      for (const [modKey, perm] of Object.entries(permissions)) {
        const mgrPerm = this.currentUser.permissions[modKey as ModuleKey];
        if (!mgrPerm) continue;
        for (const action of ['view', 'create', 'edit', 'delete', 'approve', 'export'] as const) {
          if (perm[action] && !mgrPerm[action]) {
            throw new AppError({
              code: 'PERMISSION_DENIED',
              message: `Cannot grant action '${action}' on module '${modKey}' which you do not hold yourself.`,
            });
          }
        }
      }
    }

    const updated = { ...target, permissions, updatedAt: new Date().toISOString() };
    db.users = users.map((u) => (u.id === id ? updated : u));
    this.audit('PERMISSIONS_UPDATED', 'settings', id, null, { permissionsCount: Object.keys(permissions).length }, id);
    return updated;
  }

  async updateRules(id: string, rules: UserRules) {
    const users = db.users;
    const target = users.find((u) => u.id === id);
    if (!target) throw new AppError({ code: 'NOT_FOUND', message: 'User not found' });

    const updated = { ...target, rules, updatedAt: new Date().toISOString() };
    db.users = users.map((u) => (u.id === id ? updated : u));
    this.audit('RULES_UPDATED', 'settings', id, null, { rules }, id);
    return updated;
  }

  // --- LEADS & PIPELINE ---
  async getLeads(params?: { search?: string; status?: string; stage?: string }) {
    let leads = this.filterByScope(db.leads, 'leads');
    if (params?.search) {
      const q = params.search.toLowerCase();
      leads = leads.filter((l) => l.companyName.toLowerCase().includes(q) || l.leadCode.toLowerCase().includes(q) || l.contactPerson.toLowerCase().includes(q));
    }
    if (params?.stage) {
      leads = leads.filter((l) => l.stage === params.stage);
    }
    return leads;
  }

  async getLead(id: string) {
    const leads = db.leads;
    const lead = leads.find((l) => l.id === id);
    if (!lead) throw new AppError({ code: 'NOT_FOUND', message: 'Lead not found' });
    const scoped = this.filterByScope([lead], 'leads');
    if (scoped.length === 0) throw new AppError({ code: 'SCOPE_DENIED', message: 'Lead is outside your authorized scope' });
    return lead;
  }

  async createLead(payload: Partial<LeadDto>) {
    const rules = this.currentUser.rules;
    if (payload.source && !rules.allowedLeadSources.includes(payload.source)) {
      throw new AppError({
        code: 'RULE_BLOCKED',
        message: `Lead source '${payload.source}' is restricted by your manager rules.`,
        details: { rule: 'allowedLeadSources', limit: rules.allowedLeadSources, attempted: payload.source },
      });
    }

    const year = new Date().getFullYear();
    const count = db.leads.length + 1;
    const leadCode = `LD-${year}-${String(count).padStart(4, '0')}`;

    const defaultApprovals: ApprovalStep[] = [
      'QUOTATION_UPDATE',
      'NEGOTIATION',
      'SPECIAL_APPROVAL',
      'CLIENT_CONFIRMATION',
      'PROJECT_KICKOFF',
      'EXECUTION',
      'CLOSURE_BILLING',
    ];

    const newLead: LeadDto = {
      id: `ld-${Date.now()}`,
      leadCode,
      companyName: payload.companyName || 'Untitled Corporate Lead',
      source: payload.source || 'COLD_CALL',
      industry: payload.industry || 'Healthcare / Corporate',
      city: payload.city || 'Mumbai',
      state: payload.state || 'Maharashtra',
      contactPerson: payload.contactPerson || '',
      designation: payload.designation || '',
      phone: payload.phone || '',
      email: payload.email || '',
      ownerId: payload.ownerId || this.currentUser.id,
      ownerName: this.currentUser.fullName,
      expectedValue: payload.expectedValue || 0,
      expectedClosureDate: payload.expectedClosureDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      quoteStatus: 'L1 Lead Captured',
      stage: 'L1_LEAD_CAPTURE',
      notes: payload.notes || '',
      lostReason: null,
      convertedClientId: null,
      approvalStartedAt: null,
      approvals: defaultApprovals.map((step) => ({
        step,
        approverId: null,
        approverName: null,
        decision: 'PENDING',
        remarks: null,
        decidedAt: null,
        pendingSince: null,
      })),
      activities: [
        {
          id: `act-${Date.now()}`,
          leadId: `ld-${Date.now()}`,
          type: 'CREATED',
          description: `Lead created by ${this.currentUser.fullName}`,
          actorId: this.currentUser.id,
          actorName: this.currentUser.fullName,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.leads = [newLead, ...db.leads];
    this.audit('LEAD_CREATED', 'leads', newLead.id, null, { code: leadCode, company: newLead.companyName });
    return newLead;
  }

  async updateLead(id: string, payload: Partial<LeadDto>) {
    const lead = await this.getLead(id);
    const rules = this.currentUser.rules;

    // Rule: lockAfterApprovalStarts
    if (this.currentUser.role === 'STAFF' && rules.lockAfterApprovalStarts && lead.approvalStartedAt) {
      if (payload.expectedValue !== undefined && payload.expectedValue !== lead.expectedValue) {
        throw new AppError({
          code: 'RULE_BLOCKED',
          message: 'Cannot edit expected value after approval workflow has started',
          details: { rule: 'lockAfterApprovalStarts', field: 'expectedValue' },
        });
      }
      if (payload.ownerId !== undefined && payload.ownerId !== lead.ownerId) {
        throw new AppError({
          code: 'RULE_BLOCKED',
          message: 'Cannot reassign owner after approval workflow has started',
          details: { rule: 'lockAfterApprovalStarts', field: 'ownerId' },
        });
      }
    }

    // Rule: restrictedFields check
    if (this.currentUser.role === 'STAFF') {
      for (const f of rules.restrictedFields) {
        if (payload[f as keyof LeadDto] !== undefined && payload[f as keyof LeadDto] !== lead[f as keyof LeadDto]) {
          throw new AppError({
            code: 'RULE_BLOCKED',
            message: `Field '${f}' is restricted by your manager rules.`,
            details: { rule: 'restrictedFields', field: f },
          });
        }
      }
    }

    const updated = { ...lead, ...payload, updatedAt: new Date().toISOString() };
    db.leads = db.leads.map((l) => (l.id === id ? updated : l));
    this.audit('LEAD_UPDATED', 'leads', id, { value: lead.expectedValue }, { value: updated.expectedValue });
    return updated;
  }

  async updateLeadStage(id: string, stage: PipelineStage, note?: string) {
    const lead = await this.getLead(id);
    const stageOrder: PipelineStage[] = [
      'L1_LEAD_CAPTURE',
      'L2_QUALIFIED',
      'L3_RFQ_RAISED',
      'L4_PROPOSAL',
      'L5_WON',
    ];

    if (stage === 'L5_WON') {
      throw new AppError({
        code: 'WORKFLOW_VIOLATION',
        message: 'L5_WON is set only by the approval service when step 7 (CLOSURE_BILLING) completes.',
      });
    }

    if (stage === 'LOST') {
      if (!note || note.trim() === '') {
        throw new AppError({ code: 'VALIDATION_ERROR', message: 'A mandatory lost reason note is required when marking lead as LOST.' });
      }
      lead.stage = 'LOST';
      lead.lostReason = note;
      lead.updatedAt = new Date().toISOString();
      lead.activities.push({
        id: `act-${Date.now()}`,
        leadId: id,
        type: 'STAGE_CHANGE',
        description: `Marked as LOST: ${note}`,
        actorId: this.currentUser.id,
        actorName: this.currentUser.fullName,
        createdAt: new Date().toISOString(),
      });
      db.leads = db.leads.map((l) => (l.id === id ? lead : l));
      this.audit('LEAD_LOST', 'pipeline', id, null, { reason: note });
      return lead;
    }

    const currIdx = stageOrder.indexOf(lead.stage);
    const nextIdx = stageOrder.indexOf(stage);

    if (nextIdx > currIdx) {
      if (nextIdx !== currIdx + 1) {
        throw new AppError({
          code: 'WORKFLOW_VIOLATION',
          message: 'Forward stage movement is strictly one stage at a time.',
        });
      }
      // Rule check: moving past L2_QUALIFIED with high value
      if (nextIdx > 1 && lead.expectedValue > this.currentUser.rules.maxLeadValueWithoutApproval && this.currentUser.role === 'STAFF') {
        throw new AppError({
          code: 'RULE_BLOCKED',
          message: `Expected value ₹${lead.expectedValue.toLocaleString('en-IN')} exceeds your limit without manager sign-off.`,
          details: { rule: 'maxLeadValueWithoutApproval', limit: this.currentUser.rules.maxLeadValueWithoutApproval, attempted: lead.expectedValue },
        });
      }
    } else if (nextIdx < currIdx) {
      if (!note || note.trim() === '') {
        throw new AppError({
          code: 'WORKFLOW_VIOLATION',
          message: 'Backward stage movement requires a non-blank reason note.',
        });
      }
    }

    lead.stage = stage;
    lead.updatedAt = new Date().toISOString();
    lead.activities.push({
      id: `act-${Date.now()}`,
      leadId: id,
      type: 'STAGE_CHANGE',
      description: `Stage moved to ${stage}${note ? ` (${note})` : ''}`,
      actorId: this.currentUser.id,
      actorName: this.currentUser.fullName,
      createdAt: new Date().toISOString(),
    });

    db.leads = db.leads.map((l) => (l.id === id ? lead : l));
    this.audit('STAGE_CHANGED', 'pipeline', id, { from: currIdx }, { to: nextIdx });
    return lead;
  }

  async getPipeline(): Promise<PipelineResponse> {
    const leads = this.filterByScope(db.leads, 'pipeline');
    const stages: PipelineStage[] = [
      'L1_LEAD_CAPTURE',
      'L2_QUALIFIED',
      'L3_RFQ_RAISED',
      'L4_PROPOSAL',
      'L5_WON',
    ];

    const summaries: PipelineStageSummary[] = stages.map((stg) => {
      const stageLeads = leads.filter((l) => l.stage === stg);
      const totalVal = stageLeads.reduce((acc, l) => acc + (l.expectedValue || 0), 0);
      return {
        stage: stg,
        count: stageLeads.length,
        totalValue: totalVal,
        leads: stageLeads,
      };
    });

    return {
      stages: summaries,
      totalLeads: leads.length,
      totalPipelineValue: leads.reduce((acc, l) => acc + (l.expectedValue || 0), 0),
    };
  }

  // --- APPROVALS ---
  async decideApprovalStep(leadId: string, step: ApprovalStep, decision: 'APPROVED' | 'REJECTED' | 'SENT_BACK', remarks: string) {
    if (!remarks || remarks.trim() === '') {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'Mandatory remarks required for approval decision.' });
    }

    const lead = await this.getLead(leadId);
    const stepObj = lead.approvals.find((s) => s.step === step);
    if (!stepObj) throw new AppError({ code: 'NOT_FOUND', message: 'Approval step not found' });

    // Step order validation: Only earliest PENDING step is actionable
    const pendingSteps = lead.approvals.filter((s) => s.decision === 'PENDING');
    if (pendingSteps.length === 0 || pendingSteps[0].step !== step) {
      throw new AppError({
        code: 'WORKFLOW_VIOLATION',
        message: `Only the earliest pending step (${pendingSteps[0]?.step || 'none'}) is actionable.`,
      });
    }

    if (!lead.approvalStartedAt) {
      lead.approvalStartedAt = new Date().toISOString();
    }

    stepObj.decision = decision;
    stepObj.approverId = this.currentUser.id;
    stepObj.approverName = this.currentUser.fullName;
    stepObj.remarks = remarks;
    stepObj.decidedAt = new Date().toISOString();

    if (decision === 'APPROVED') {
      if (step === 'CLOSURE_BILLING') {
        // Step 7 completed -> Lead is WON
        lead.stage = 'L5_WON';
        lead.quoteStatus = 'Won & Invoice Eligible';
      }
    } else if (decision === 'REJECTED') {
      lead.stage = 'L4_PROPOSAL';
      lead.quoteStatus = 'Approval Rejected';
      // Reset subsequent steps
      lead.approvals = lead.approvals.map((s) => ({
        ...s,
        decision: 'PENDING',
        approverId: null,
        approverName: null,
        remarks: null,
      }));
    } else if (decision === 'SENT_BACK') {
      // Revert previous step to pending
      const idx = lead.approvals.findIndex((s) => s.step === step);
      if (idx > 0) {
        lead.approvals[idx - 1].decision = 'PENDING';
      }
      stepObj.decision = 'PENDING';
    }

    lead.updatedAt = new Date().toISOString();
    lead.activities.push({
      id: `act-${Date.now()}`,
      leadId,
      type: 'APPROVAL',
      description: `${step} ${decision} by ${this.currentUser.fullName}: ${remarks}`,
      actorId: this.currentUser.id,
      actorName: this.currentUser.fullName,
      createdAt: new Date().toISOString(),
    });

    db.leads = db.leads.map((l) => (l.id === leadId ? lead : l));
    this.audit('APPROVAL_DECIDED', 'approvals', leadId, { step, decision }, { remarks });
    return lead;
  }

  // --- COLD CALLING ---
  async getColdCalls() {
    return this.filterByScope(db.coldCalls, 'cold_calling');
  }

  async createColdCall(payload: Partial<ColdCallDto>) {
    const newCall: ColdCallDto = {
      id: `cc-${Date.now()}`,
      callDateTime: payload.callDateTime || new Date().toISOString(),
      companyName: payload.companyName || '',
      contactPerson: payload.contactPerson || '',
      phone: payload.phone || '',
      outcome: payload.outcome || 'INTERESTED',
      notes: payload.notes || '',
      nextAction: payload.nextAction || '',
      nextActionDate: payload.nextActionDate || new Date(Date.now() + 86400000).toISOString().split('T')[0],
      convertedLeadId: null,
      staffId: this.currentUser.id,
      staffName: this.currentUser.fullName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.coldCalls = [newCall, ...db.coldCalls];
    return newCall;
  }

  async convertColdCall(callId: string) {
    const calls = db.coldCalls;
    const call = calls.find((c) => c.id === callId);
    if (!call) throw new AppError({ code: 'NOT_FOUND', message: 'Call record not found' });

    if (call.convertedLeadId) {
      // Idempotent return existing
      const existing = db.leads.find((l) => l.id === call.convertedLeadId);
      if (existing) return existing;
    }

    const lead = await this.createLead({
      companyName: call.companyName,
      contactPerson: call.contactPerson,
      phone: call.phone,
      source: 'COLD_CALL',
      notes: `Converted from cold call: ${call.notes}`,
      ownerId: this.currentUser.id,
    });

    call.convertedLeadId = lead.id;
    db.coldCalls = calls.map((c) => (c.id === callId ? call : c));
    return lead;
  }

  // --- RFQS ---
  async getRfqs() {
    return this.filterByScope(db.rfqs, 'rfq');
  }

  async createRfq(payload: Partial<RfqDto>) {
    const lead = await this.getLead(payload.leadId || '');
    if (lead.stage !== 'L2_QUALIFIED' && lead.stage !== 'L3_RFQ_RAISED') {
      throw new AppError({
        code: 'WORKFLOW_VIOLATION',
        message: 'An RFQ can only be created against a lead in L2_QUALIFIED or L3_RFQ_RAISED stage.',
      });
    }

    // Advance lead to L3_RFQ_RAISED if in L2
    if (lead.stage === 'L2_QUALIFIED') {
      await this.updateLeadStage(lead.id, 'L3_RFQ_RAISED', 'Auto-advanced upon RFQ creation');
    }

    const year = new Date().getFullYear();
    const count = db.rfqs.length + 1;
    const rfqCode = `RFQ-${year}-${String(count).padStart(4, '0')}`;

    const newRfq: RfqDto = {
      id: `rfq-${Date.now()}`,
      rfqCode,
      leadId: lead.id,
      leadCompany: lead.companyName,
      clientContactName: payload.clientContactName || lead.contactPerson,
      clientContactPhone: payload.clientContactPhone || lead.phone,
      requirementScope: payload.requirementScope || '',
      targetDate: payload.targetDate || '',
      status: 'DRAFT',
      approverId: null,
      discountPercent: payload.discountPercent || 0,
      finalAmount: payload.finalAmount || lead.expectedValue,
      notes: payload.notes || '',
      vendorQuotes: payload.vendorQuotes || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.rfqs = [newRfq, ...db.rfqs];
    return newRfq;
  }

  // --- CLIENTS ---
  async getClients() {
    return this.filterByScope(db.clients, 'clients');
  }

  async createClient(payload: Partial<ClientDto>) {
    const year = new Date().getFullYear();
    const count = db.clients.length + 1;
    const clientCode = `CL-${year}-${String(count).padStart(4, '0')}`;

    const newClient: ClientDto = {
      id: `cl-${Date.now()}`,
      clientCode,
      clientName: payload.clientName || 'Untitled Client',
      clientType: payload.clientType || 'CORPORATE',
      contactPerson: payload.contactPerson || '',
      phone: payload.phone || '',
      email: payload.email || '',
      addressLine: payload.addressLine || '',
      city: payload.city || '',
      state: payload.state || '',
      pincode: payload.pincode || '',
      gstin: payload.gstin || '',
      pan: payload.pan || '',
      registrationDate: payload.registrationDate || new Date().toISOString().split('T')[0],
      agreementStartDate: payload.agreementStartDate || '',
      agreementEndDate: payload.agreementEndDate || '',
      linkedLeadId: payload.linkedLeadId || null,
      active: true,
      notes: payload.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.clients = [newClient, ...db.clients];
    return newClient;
  }

  // --- VENDORS ---
  async getVendors() {
    return this.filterByScope(db.vendors, 'vendors');
  }

  async empanelVendor(id: string) {
    if (this.currentUser.role !== 'SUPER_MANAGER' && this.currentUser.department !== 'OPERATIONS') {
      throw new AppError({ code: 'PERMISSION_DENIED', message: 'Only Operations Manager or Super Manager can empanel vendors.' });
    }
    const vendor = db.vendors.find((v) => v.id === id);
    if (!vendor) throw new AppError({ code: 'NOT_FOUND', message: 'Vendor not found' });
    vendor.status = 'EMPANELLED';
    vendor.updatedAt = new Date().toISOString();
    db.vendors = db.vendors.map((v) => (v.id === id ? vendor : v));
    this.audit('VENDOR_EMPANELLED', 'vendors', id, null, { status: 'EMPANELLED' });
    return vendor;
  }

  // --- INVOICES ---
  async getInvoices() {
    return this.filterByScope(db.invoices, 'invoices');
  }

  async createInvoice(payload: Partial<InvoiceDto>) {
    const lead = await this.getLead(payload.leadId || '');
    if (lead.stage !== 'L5_WON') {
      throw new AppError({
        code: 'WORKFLOW_VIOLATION',
        message: `Creation allowed ONLY against a Won lead. Current stage is ${lead.stage}.`,
      });
    }

    const year = new Date().getFullYear();
    const count = db.invoices.length + 1;
    const invoiceNo = `INV-${year}-${String(count).padStart(4, '0')}`;

    const amount = payload.amount || 100000;
    const taxAmount = amount * 0.18;
    const totalAmount = amount + taxAmount;

    const newInv: InvoiceDto = {
      id: `inv-${Date.now()}`,
      invoiceNo,
      leadId: lead.id,
      clientId: payload.clientId || lead.convertedClientId || 'cl-001',
      clientName: payload.clientName || lead.companyName,
      invoiceDate: payload.invoiceDate || new Date().toISOString().split('T')[0],
      dueDate: payload.dueDate || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      amount,
      taxAmount,
      totalAmount,
      receivedAmount: 0,
      balanceAmount: totalAmount,
      status: 'DRAFT',
      paymentTerms: payload.paymentTerms || 'Net 30',
      notes: payload.notes || '',
      bdApproved: false,
      financeApproved: false,
      businessHeadApproved: false,
      payments: [],
      followUps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.invoices = [newInv, ...db.invoices];
    return newInv;
  }

  async recordInvoicePayment(invoiceId: string, amount: number, paymentMode: any, reference: string) {
    const inv = db.invoices.find((i) => i.id === invoiceId);
    if (!inv) throw new AppError({ code: 'NOT_FOUND', message: 'Invoice not found' });

    if (inv.receivedAmount + amount > inv.totalAmount) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: `Payment of ₹${amount} exceeds outstanding balance of ₹${inv.balanceAmount}.`,
      });
    }

    inv.receivedAmount += amount;
    inv.balanceAmount = inv.totalAmount - inv.receivedAmount;
    inv.status = inv.balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    inv.payments.push({
      id: `pay-${Date.now()}`,
      invoiceId,
      amount,
      paymentMode,
      receivedDate: new Date().toISOString().split('T')[0],
      reference,
      recordedBy: this.currentUser.id,
      recordedByName: this.currentUser.fullName,
      createdAt: new Date().toISOString(),
    });

    db.invoices = db.invoices.map((i) => (i.id === invoiceId ? inv : i));
    this.audit('PAYMENT_RECORDED', 'invoices', invoiceId, null, { amount, reference });
    return inv;
  }

  // --- ATTENDANCE & FIELD VISITS ---
  async getAttendance() {
    return this.filterByScope(db.attendance, 'attendance');
  }

  async checkIn(latitude: number | null, longitude: number | null, locationLabel?: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = db.attendance.find((a) => a.userId === this.currentUser.id && a.date === today);
    if (existing) {
      throw new AppError({ code: 'CONFLICT', message: 'Already checked in for today.' });
    }

    const rec: AttendanceDto = {
      id: `att-${Date.now()}`,
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      department: this.currentUser.department,
      date: today,
      checkInAt: new Date().toISOString(),
      checkInLat: latitude,
      checkInLng: longitude,
      checkInLocation: locationLabel || (latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Location unavailable'),
      checkOutAt: null,
      checkOutLat: null,
      checkOutLng: null,
      checkOutLocation: null,
      hoursWorked: 0,
      status: 'PRESENT',
      manualReason: null,
      markedBy: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.attendance = [rec, ...db.attendance];
    return rec;
  }

  async checkOut(latitude: number | null, longitude: number | null, locationLabel?: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = db.attendance.find((a) => a.userId === this.currentUser.id && a.date === today);
    if (!existing || !existing.checkInAt) {
      throw new AppError({ code: 'WORKFLOW_VIOLATION', message: 'Check-out requires an active check-in today.' });
    }

    const checkInTime = new Date(existing.checkInAt).getTime();
    const nowTime = Date.now();
    const hours = Math.max(0.1, Number(((nowTime - checkInTime) / 3600000).toFixed(2)));

    existing.checkOutAt = new Date().toISOString();
    existing.checkOutLat = latitude;
    existing.checkOutLng = longitude;
    existing.checkOutLocation = locationLabel || (latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Location unavailable');
    existing.hoursWorked = hours;
    existing.updatedAt = new Date().toISOString();

    db.attendance = db.attendance.map((a) => (a.id === existing.id ? existing : a));
    return existing;
  }

  async getFieldVisits() {
    return this.filterByScope(db.fieldVisits, 'field_visits');
  }

  async startFieldVisit(payload: Partial<FieldVisitDto>) {
    // Check GPS rule
    if (this.currentUser.rules.requireGpsForFieldVisit && (!payload.startLat || !payload.startLng)) {
      throw new AppError({
        code: 'RULE_BLOCKED',
        message: 'GPS location capture is required by your manager for field visits.',
        details: { rule: 'requireGpsForFieldVisit', limit: true, attempted: false },
      });
    }

    const activeVisit = db.fieldVisits.find((v) => v.userId === this.currentUser.id && v.status === 'IN_PROGRESS');
    if (activeVisit) {
      throw new AppError({ code: 'CONFLICT', message: 'You already have an IN_PROGRESS field visit. Complete it first.' });
    }

    const newVisit: FieldVisitDto = {
      id: `fv-${Date.now()}`,
      userId: this.currentUser.id,
      userName: this.currentUser.fullName,
      clientId: payload.clientId || null,
      companyName: payload.companyName || '',
      purpose: payload.purpose || 'CLIENT_MEETING',
      plannedNotes: payload.plannedNotes || '',
      startedAt: new Date().toISOString(),
      startLat: payload.startLat || null,
      startLng: payload.startLng || null,
      startLocation: payload.startLocation || 'Recorded GPS coordinate',
      endedAt: null,
      endLat: null,
      endLng: null,
      endLocation: null,
      durationMinutes: null,
      outcomeNotes: null,
      status: 'IN_PROGRESS',
      linkedExpenseId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.fieldVisits = [newVisit, ...db.fieldVisits];
    return newVisit;
  }

  async endFieldVisit(id: string, outcomeNotes: string, endLat?: number, endLng?: number, endLocation?: string) {
    const visit = db.fieldVisits.find((v) => v.id === id);
    if (!visit) throw new AppError({ code: 'NOT_FOUND', message: 'Field visit not found' });
    if (visit.userId !== this.currentUser.id && this.currentUser.role === 'STAFF') {
      throw new AppError({ code: 'SCOPE_DENIED', message: 'Cannot end another user’s visit.' });
    }

    const startTime = new Date(visit.startedAt).getTime();
    const duration = Math.round((Date.now() - startTime) / 60000);

    visit.endedAt = new Date().toISOString();
    visit.endLat = endLat || null;
    visit.endLng = endLng || null;
    visit.endLocation = endLocation || 'Logged at closure';
    visit.durationMinutes = Math.max(1, duration);
    visit.outcomeNotes = outcomeNotes;
    visit.status = 'COMPLETED';
    visit.updatedAt = new Date().toISOString();

    db.fieldVisits = db.fieldVisits.map((v) => (v.id === id ? visit : v));
    return visit;
  }

  // --- EXPENSES ---
  async getExpenses() {
    return this.filterByScope(db.expenses, 'expenses');
  }

  async submitExpense(payload: Partial<ExpenseDto>) {
    const limit = this.currentUser.rules.maxExpenseAmount;
    const amount = payload.amount || 0;

    // Routing by maxExpenseAmount rule
    let approverId = this.currentUser.managerId || 'u-mgr-pratik';
    let approverName = 'Manager';
    if (amount > limit || this.currentUser.role === 'MANAGER') {
      approverId = 'u-super-ravi';
      approverName = 'Ravi Prakash Namdeo (Super Manager)';
    }

    const newExp: ExpenseDto = {
      id: `exp-${Date.now()}`,
      expenseDate: payload.expenseDate || new Date().toISOString().split('T')[0],
      category: payload.category || 'TRAVEL',
      amount,
      fieldVisitId: payload.fieldVisitId || null,
      receiptReference: payload.receiptReference || null,
      notes: payload.notes || '',
      status: 'PENDING',
      submittedBy: this.currentUser.id,
      submittedByName: this.currentUser.fullName,
      approverId,
      approverName,
      decisionRemarks: null,
      decidedAt: null,
      reimbursedAt: null,
      reimbursementMode: null,
      reimbursementReference: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.expenses = [newExp, ...db.expenses];
    return newExp;
  }

  async decideExpense(id: string, decision: 'APPROVED' | 'REJECTED', remarks: string) {
    const exp = db.expenses.find((e) => e.id === id);
    if (!exp) throw new AppError({ code: 'NOT_FOUND', message: 'Expense not found' });
    if (decision === 'REJECTED' && (!remarks || remarks.trim() === '')) {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'Rejection remarks are mandatory' });
    }
    exp.status = decision;
    exp.decisionRemarks = remarks;
    exp.decidedAt = new Date().toISOString();
    exp.updatedAt = new Date().toISOString();
    db.expenses = db.expenses.map((e) => (e.id === id ? exp : e));
    return exp;
  }

  async reimburseExpense(id: string, paymentMode: any, reference: string) {
    const exp = db.expenses.find((e) => e.id === id);
    if (!exp) throw new AppError({ code: 'NOT_FOUND', message: 'Expense not found' });
    if (exp.status !== 'APPROVED') {
      throw new AppError({ code: 'WORKFLOW_VIOLATION', message: 'Only APPROVED expenses can be marked reimbursed' });
    }
    exp.status = 'REIMBURSED';
    exp.reimbursementMode = paymentMode;
    exp.reimbursementReference = reference;
    exp.reimbursedAt = new Date().toISOString();
    exp.updatedAt = new Date().toISOString();
    db.expenses = db.expenses.map((e) => (e.id === id ? exp : e));
    return exp;
  }

  // --- REVENUE ---
  async getRevenues() {
    return this.filterByScope(db.revenues, 'revenue');
  }

  async createRevenue(payload: Partial<RevenueDto>) {
    if (!payload.clientId && !payload.clientNameFreeText) {
      throw new AppError({ code: 'VALIDATION_ERROR', message: 'Either select a registered client or provide client name free text.' });
    }

    const newRev: RevenueDto = {
      id: `rev-${Date.now()}`,
      revenueDate: payload.revenueDate || new Date().toISOString().split('T')[0],
      clientId: payload.clientId || null,
      clientNameFreeText: payload.clientNameFreeText || null,
      staffId: payload.staffId || this.currentUser.id,
      staffName: this.currentUser.fullName,
      category: payload.category || 'CORPORATE_PACKAGE',
      amount: payload.amount || 0,
      paymentMode: payload.paymentMode || 'NEFT',
      referenceNo: payload.referenceNo || 'REF-DIRECT',
      notes: payload.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.revenues = [newRev, ...db.revenues];
    return newRev;
  }

  // --- VENDOR BILLS ---
  async getVendorBills() {
    return this.filterByScope(db.vendorBills, 'vendor_payments');
  }

  async createVendorBill(payload: Partial<VendorBillDto>) {
    const amount = payload.amount || 0;
    const newBill: VendorBillDto = {
      id: `vb-${Date.now()}`,
      vendorId: payload.vendorId || 'vn-001',
      vendorName: payload.vendorName || 'Vendor',
      billReference: payload.billReference || `BILL-${Date.now()}`,
      category: payload.category || 'LAB',
      billDate: payload.billDate || new Date().toISOString().split('T')[0],
      dueDate: payload.dueDate || new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      amount,
      paidAmount: 0,
      balanceAmount: amount,
      status: 'UNPAID',
      notes: payload.notes || '',
      payments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    db.vendorBills = [newBill, ...db.vendorBills];
    return newBill;
  }

  async recordVendorBillPayment(billId: string, amount: number, paymentMode: any, reference: string) {
    const bill = db.vendorBills.find((b) => b.id === billId);
    if (!bill) throw new AppError({ code: 'NOT_FOUND', message: 'Bill not found' });
    if (bill.paidAmount + amount > bill.amount) {
      throw new AppError({
        code: 'VALIDATION_ERROR',
        message: `Payment of ₹${amount} exceeds pending bill balance of ₹${bill.balanceAmount}.`,
      });
    }

    bill.paidAmount += amount;
    bill.balanceAmount = bill.amount - bill.paidAmount;
    bill.status = bill.balanceAmount <= 0 ? 'PAID' : 'PARTIALLY_PAID';
    bill.payments.push({
      id: `vbp-${Date.now()}`,
      billId,
      amount,
      paymentMode,
      paidDate: new Date().toISOString().split('T')[0],
      reference,
      recordedBy: this.currentUser.id,
      createdAt: new Date().toISOString(),
    });

    db.vendorBills = db.vendorBills.map((b) => (b.id === billId ? bill : b));
    return bill;
  }

  // --- DASHBOARD ---
  async getDashboard(): Promise<DashboardDto> {
    const leads = db.leads;
    const liveLeads = leads.filter((l) => l.stage !== 'L5_WON' && l.stage !== 'LOST');
    const wonLeads = leads.filter((l) => l.stage === 'L5_WON');
    const totalRev = db.revenues.reduce((acc, r) => acc + r.amount, 0);
    const outstandingInvs = db.invoices.reduce((acc, i) => acc + i.balanceAmount, 0);

    const pendingApprovalsCount = leads.reduce((acc, l) => {
      const pending = l.approvals.filter((s) => s.decision === 'PENDING');
      return acc + (pending.length > 0 ? 1 : 0);
    }, 0);

    // Stuck leads: no activity > 14 days
    const fourteenDaysAgo = Date.now() - 14 * 86400000;
    const stuckLeads = leads.filter((l) => {
      const lastUpdate = new Date(l.updatedAt).getTime();
      return l.stage !== 'L5_WON' && l.stage !== 'LOST' && lastUpdate < fourteenDaysAgo;
    });

    const myLeads = leads.filter((l) => l.ownerId === this.currentUser.id);

    return {
      role: this.currentUser.role,
      metrics: {
        totalLeads: leads.length,
        liveLeads: liveLeads.length,
        workInProgress: liveLeads.filter((l) => l.stage === 'L3_RFQ_RAISED' || l.stage === 'L4_PROPOSAL').length,
        closedDeals: wonLeads.length,
        pendingApprovals: pendingApprovalsCount,
        totalOutstanding: outstandingInvs,
        pipelineValue: liveLeads.reduce((acc, l) => acc + l.expectedValue, 0),
        todayRevenue: 100000.0,
        mtdRevenue: totalRev,
        vendorPayable: db.vendorBills.reduce((acc, b) => acc + b.balanceAmount, 0),
        staffCheckedIn: db.attendance.length,
        activeFieldVisits: db.fieldVisits.filter((v) => v.status === 'IN_PROGRESS').length,
        myLeads: myLeads.length,
        myCallsToday: db.coldCalls.filter((c) => c.staffId === this.currentUser.id).length,
        myPendingApprovals: 2,
        myExpenses: db.expenses.filter((e) => e.submittedBy === this.currentUser.id).length,
        myAttendanceStatus: 'PRESENT',
        myFollowUpsDueToday: 1,
      },
      leadStatusDistribution: [
        { stage: 'L1_LEAD_CAPTURE', count: leads.filter((l) => l.stage === 'L1_LEAD_CAPTURE').length },
        { stage: 'L2_QUALIFIED', count: leads.filter((l) => l.stage === 'L2_QUALIFIED').length },
        { stage: 'L3_RFQ_RAISED', count: leads.filter((l) => l.stage === 'L3_RFQ_RAISED').length },
        { stage: 'L4_PROPOSAL', count: leads.filter((l) => l.stage === 'L4_PROPOSAL').length },
        { stage: 'L5_WON', count: leads.filter((l) => l.stage === 'L5_WON').length },
        { stage: 'LOST', count: leads.filter((l) => l.stage === 'LOST').length },
      ],
      sourceWiseLeads: [
        { source: 'COLD_CALL', count: leads.filter((l) => l.source === 'COLD_CALL').length },
        { source: 'REFERRAL', count: leads.filter((l) => l.source === 'REFERRAL').length },
        { source: 'INBOUND', count: leads.filter((l) => l.source === 'INBOUND').length },
        { source: 'EVENT', count: leads.filter((l) => l.source === 'EVENT').length },
        { source: 'EXISTING_CLIENT_UPSELL', count: leads.filter((l) => l.source === 'EXISTING_CLIENT_UPSELL').length },
      ],
      monthlyRevenueTrend: [
        { month: 'Apr', revenue: 420000 },
        { month: 'May', revenue: 680000 },
        { month: 'Jun', revenue: 590000 },
        { month: 'Jul', revenue: 840000 },
        { month: 'Aug', revenue: 1120000 },
        { month: 'Sep', revenue: 950000 },
      ],
      departmentPerformance: [
        { department: 'SALES_BD', revenue: 1250000, leads: 18 },
        { department: 'OPERATIONS', revenue: 850000, leads: 5 },
        { department: 'FINANCE', revenue: 600000, leads: 2 },
      ],
      stuckLeads,
      teamActivityToday: [
        { staffName: 'Amit Kumar', action: 'Checked in at BKC Mumbai', time: '09:05 AM' },
        { staffName: 'Priya Singh', action: 'Logged Cold Call with WNS Global', time: '09:35 AM' },
        { staffName: 'Amit Kumar', action: 'Started Field Visit: Tata Technologies', time: '10:30 AM' },
        { staffName: 'Vikram Joshi', action: 'Recorded payment ₹1,00,000 for Reliance Retail', time: '11:00 AM' },
      ],
    };
  }

  // --- TEAM PERFORMANCE ---
  async getTeamPerformance(): Promise<TeamPerformanceUserDto[]> {
    return [
      { userId: 'u-stf-amit', fullName: 'Amit Kumar', department: 'SALES_BD', leadCount: 12, callCount: 28, closedDealValue: 1250000, revenueContribution: 950000, attendancePercentage: 98, pendingExpenses: 850 },
      { userId: 'u-stf-priya', fullName: 'Priya Singh', department: 'SALES_BD', leadCount: 8, callCount: 35, closedDealValue: 620000, revenueContribution: 450000, attendancePercentage: 96, pendingExpenses: 0 },
      { userId: 'u-stf-rahul', fullName: 'Rahul Nair', department: 'OPERATIONS', leadCount: 4, callCount: 10, closedDealValue: 850000, revenueContribution: 720000, attendancePercentage: 94, pendingExpenses: 1200 },
      { userId: 'u-stf-sneha', fullName: 'Sneha Patel', department: 'OPERATIONS', leadCount: 3, callCount: 12, closedDealValue: 350000, revenueContribution: 310000, attendancePercentage: 100, pendingExpenses: 500 },
      { userId: 'u-stf-vikram', fullName: 'Vikram Joshi', department: 'FINANCE', leadCount: 1, callCount: 5, closedDealValue: 0, revenueContribution: 1100000, attendancePercentage: 98, pendingExpenses: 0 },
      { userId: 'u-stf-ananya', fullName: 'Ananya Desai', department: 'FINANCE', leadCount: 0, callCount: 0, closedDealValue: 0, revenueContribution: 0, attendancePercentage: 100, pendingExpenses: 0 },
    ];
  }

  // --- NOTIFICATIONS ---
  async getNotifications() {
    return db.notifications;
  }

  async markNotificationRead(id: string) {
    const notifs = db.notifications;
    db.notifications = notifs.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
    return true;
  }

  async markAllNotificationsRead() {
    const notifs = db.notifications;
    db.notifications = notifs.map((n) => ({ ...n, readAt: n.readAt || new Date().toISOString() }));
    return true;
  }

  // --- SETTINGS & MASTER DATA ---
  async getSettings() {
    return db.settings;
  }

  async updateSettings(payload: Partial<SettingsDto>) {
    const updated = { ...db.settings, ...payload };
    db.settings = updated;
    this.audit('SETTINGS_UPDATED', 'settings', 'global', null, payload as Record<string, unknown>);
    return updated;
  }

  async getAuditLogs() {
    return db.auditLogs;
  }
}

export const mockAdapter = new MockAdapter();
