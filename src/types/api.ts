export type Role = 'SUPER_MANAGER' | 'MANAGER' | 'STAFF';
export type UserRole = Role;

export type Department = 'SALES_BD' | 'OPERATIONS' | 'FINANCE';

export type ModuleKey =
  | 'dashboard'
  | 'leads'
  | 'pipeline'
  | 'approvals'
  | 'cold_calling'
  | 'rfq'
  | 'clients'
  | 'attendance'
  | 'field_visits'
  | 'vendors'
  | 'vendor_payments'
  | 'invoices'
  | 'outstanding'
  | 'revenue'
  | 'expenses'
  | 'team'
  | 'settings'
  | 'notifications';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';

export type DataScope = 'OWN' | 'TEAM' | 'ALL';

export type PipelineStage =
  | 'L1_LEAD_CAPTURE'
  | 'L2_QUALIFIED'
  | 'L3_RFQ_RAISED'
  | 'L4_PROPOSAL'
  | 'L5_WON'
  | 'LOST';

export type LeadSource =
  | 'COLD_CALL'
  | 'REFERRAL'
  | 'INBOUND'
  | 'EVENT'
  | 'EXISTING_CLIENT_UPSELL'
  | 'PARTNER'
  | 'OTHER';

export type ApprovalStep =
  | 'QUOTATION_UPDATE'
  | 'NEGOTIATION'
  | 'SPECIAL_APPROVAL'
  | 'CLIENT_CONFIRMATION'
  | 'PROJECT_KICKOFF'
  | 'EXECUTION'
  | 'CLOSURE_BILLING';

export type ApprovalDecision = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SENT_BACK';

export type CallOutcome =
  | 'INTERESTED'
  | 'NOT_INTERESTED'
  | 'NOT_REACHABLE'
  | 'CALLBACK_REQUESTED'
  | 'WRONG_NUMBER';

export type RfqStatus = 'DRAFT' | 'UNDER_REVIEW' | 'SUBMITTED_TO_CLIENT' | 'ACCEPTED' | 'REJECTED';

export type ClientType = 'CORPORATE' | 'OHC' | 'FRANCHISE' | 'INDIVIDUAL' | 'OTHER';

export type VendorCategory = 'HOSPITAL' | 'LAB' | 'HOME_COLLECTION' | 'DIAGNOSTIC_CENTRE' | 'OTHER';

export type VendorStatus = 'DOCUMENTS_PENDING' | 'UNDER_VERIFICATION' | 'EMPANELLED' | 'SUSPENDED';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LEAVE' | 'HALF_DAY';

export type VisitPurpose =
  | 'CLIENT_MEETING'
  | 'SAMPLE_COLLECTION'
  | 'HEALTH_CAMP'
  | 'CONTRACT_DISCUSSION'
  | 'PAYMENT_COLLECTION'
  | 'OTHER';

export type VisitStatus = 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type BillStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export type PaymentMode = 'NEFT' | 'UPI' | 'CHEQUE' | 'CASH' | 'CARD' | 'OTHER';

export type RevenueCategory =
  | 'FULL_BODY_CHECKUP'
  | 'INDIVIDUAL_TEST'
  | 'CORPORATE_PACKAGE'
  | 'HOME_COLLECTION'
  | 'CONSULTATION'
  | 'OTHER';

export type ExpenseCategory =
  | 'TRAVEL'
  | 'FUEL'
  | 'FOOD'
  | 'ACCOMMODATION'
  | 'CLIENT_ENTERTAINMENT'
  | 'OTHER';

export type ExpenseStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'REIMBURSED';

export type NotificationType =
  | 'VENDOR_BILL_OVERDUE'
  | 'VENDOR_PAYMENT_DUE'
  | 'RATE_CARD_RENEWAL'
  | 'AGREEMENT_EXPIRY'
  | 'ATTENDANCE_MISSING'
  | 'LEAD_INACTIVE'
  | 'INVOICE_ESCALATION'
  | 'APPROVAL_PENDING';

export type Severity = 'INFO' | 'WARNING' | 'CRITICAL';

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'TOKEN_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'RULE_BLOCKED'
  | 'SCOPE_DENIED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'WORKFLOW_VIOLATION'
  | 'MANAGER_LIMIT_REACHED'
  | 'SERVER_ERROR';

export interface RuleBlockedDetails {
  rule: string;
  limit?: number | string | string[];
  attempted?: number | string | string[];
  [key: string]: unknown;
}

export interface ApiError {
  code: ErrorCode;
  message: string;
  field?: string;
  details?: RuleBlockedDetails | Record<string, unknown>;
}

export interface PageMeta {
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  page?: PageMeta;
  error?: ApiError;
}

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean;
  export: boolean;
  scope: DataScope;
}

export type PermissionsMap = Record<ModuleKey, ModulePermission>;

export interface UserRules {
  editWindowHours: number;
  lockAfterApprovalStarts: boolean;
  maxLeadValueWithoutApproval: number;
  maxDiscountPercent: number;
  maxExpenseAmount: number;
  requireGpsForFieldVisit: boolean;
  canExportData: boolean;
  allowedLeadSources: LeadSource[];
  restrictedFields: string[];
  workingHoursOnly: boolean;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: Role;
  department: Department;
  territory: string;
  managerId: string | null;
  active: boolean;
  permissions: PermissionsMap;
  rules: UserRules;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: UserDto;
}

export interface LeadActivityDto {
  id: string;
  leadId: string;
  type: string;
  description: string;
  actorId: string;
  actorName?: string;
  createdAt: string;
}

export interface ApprovalStepState {
  step: ApprovalStep;
  approverId: string | null;
  approverName: string | null;
  decision: ApprovalDecision;
  remarks: string | null;
  decidedAt: string | null;
  pendingSince: string | null;
}

export interface LeadDto {
  id: string;
  leadCode: string;
  companyName: string;
  source: LeadSource;
  industry: string;
  city: string;
  state: string;
  contactPerson: string;
  designation: string;
  phone: string;
  email: string;
  ownerId: string;
  ownerName?: string;
  expectedValue: number;
  expectedClosureDate: string;
  quoteStatus: string;
  stage: PipelineStage;
  notes: string;
  lostReason?: string | null;
  convertedClientId?: string | null;
  approvalStartedAt?: string | null;
  approvals: ApprovalStepState[];
  activities: LeadActivityDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStageSummary {
  stage: PipelineStage;
  count: number;
  totalValue: number;
  leads: LeadDto[];
}

export interface PipelineResponse {
  stages: PipelineStageSummary[];
  totalLeads: number;
  totalPipelineValue: number;
}

export interface ColdCallDto {
  id: string;
  callDateTime: string;
  companyName: string;
  contactPerson: string;
  phone: string;
  outcome: CallOutcome;
  notes: string;
  nextAction: string;
  nextActionDate: string;
  convertedLeadId: string | null;
  staffId: string;
  staffName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RfqVendorQuoteDto {
  id: string;
  rfqId: string;
  vendorId: string;
  vendorName?: string;
  quotedAmount: number;
  validUntil: string;
  notes: string;
  selected: boolean;
}

export interface RfqDto {
  id: string;
  rfqCode: string;
  leadId: string;
  leadCompany?: string;
  clientContactName: string;
  clientContactPhone: string;
  requirementScope: string;
  targetDate: string;
  status: RfqStatus;
  approverId: string | null;
  discountPercent: number;
  finalAmount: number;
  notes: string;
  vendorQuotes: RfqVendorQuoteDto[];
  createdAt: string;
  updatedAt: string;
}

export interface ClientDto {
  id: string;
  clientCode: string;
  clientName: string;
  clientType: ClientType;
  contactPerson: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  pan: string;
  registrationDate: string;
  agreementStartDate: string;
  agreementEndDate: string;
  linkedLeadId: string | null;
  active: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface VendorDocumentDto {
  docType: 'EMPANELMENT' | 'GST' | 'PAN' | 'BANK_DETAILS' | 'RATE_CARD';
  received: boolean;
  fileReference: string | null;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface VendorDto {
  id: string;
  vendorCode: string;
  vendorName: string;
  category: VendorCategory;
  contactPerson: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  pan: string;
  bankAccountName: string;
  bankAccountNumber: string;
  ifsc: string;
  rateCardValidFrom: string;
  rateCardValidTo: string;
  renewalDueDate: string;
  agreementStartDate: string;
  agreementEndDate: string;
  status: VendorStatus;
  notes: string;
  documents: VendorDocumentDto[];
  totalPayable: number;
  totalPaid: number;
  outstandingBalance: number;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceDto {
  id: string;
  userId: string;
  userName?: string;
  department?: Department;
  date: string;
  checkInAt: string | null;
  checkInLat: number | null;
  checkInLng: number | null;
  checkInLocation: string | null;
  checkOutAt: string | null;
  checkOutLat: number | null;
  checkOutLng: number | null;
  checkOutLocation: string | null;
  hoursWorked: number;
  status: AttendanceStatus;
  manualReason: string | null;
  markedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FieldVisitDto {
  id: string;
  userId: string;
  userName?: string;
  clientId: string | null;
  companyName: string;
  purpose: VisitPurpose;
  plannedNotes: string;
  startedAt: string;
  startLat: number | null;
  startLng: number | null;
  startLocation: string | null;
  endedAt: string | null;
  endLat: number | null;
  endLng: number | null;
  endLocation: string | null;
  durationMinutes: number | null;
  outcomeNotes: string | null;
  status: VisitStatus;
  linkedExpenseId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InvoicePaymentDto {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMode: PaymentMode;
  receivedDate: string;
  reference: string;
  recordedBy: string;
  recordedByName?: string;
  createdAt: string;
}

export interface InvoiceFollowUpDto {
  id: string;
  invoiceId: string;
  note: string;
  commitmentDate: string;
  nextFollowUpDate: string;
  contactPerson: string;
  loggedBy: string;
  loggedByName?: string;
  createdAt: string;
}

export interface InvoiceDto {
  id: string;
  invoiceNo: string;
  leadId: string;
  clientId: string;
  clientName?: string;
  invoiceDate: string;
  dueDate: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  receivedAmount: number;
  balanceAmount: number;
  status: InvoiceStatus;
  paymentTerms: string;
  notes: string;
  bdApproved: boolean;
  bdApprovedAt?: string | null;
  bdApproverRemarks?: string | null;
  financeApproved: boolean;
  financeApprovedAt?: string | null;
  financeApproverRemarks?: string | null;
  businessHeadApproved: boolean;
  businessHeadApprovedAt?: string | null;
  businessHeadApproverRemarks?: string | null;
  payments: InvoicePaymentDto[];
  followUps: InvoiceFollowUpDto[];
  createdAt: string;
  updatedAt: string;
}

export interface OutstandingBucket {
  bucket: '0_30' | '31_60' | '60_PLUS';
  label: string;
  totalAmount: number;
  count: number;
  invoices: InvoiceDto[];
}

export interface OutstandingResponse {
  summary: {
    totalOutstanding: number;
    bucket0To30: number;
    bucket31To60: number;
    bucket60Plus: number;
  };
  buckets: OutstandingBucket[];
}

export interface VendorBillPaymentDto {
  id: string;
  billId: string;
  amount: number;
  paymentMode: PaymentMode;
  paidDate: string;
  reference: string;
  recordedBy: string;
  createdAt: string;
}

export interface VendorBillDto {
  id: string;
  vendorId: string;
  vendorName?: string;
  billReference: string;
  category: VendorCategory;
  billDate: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  balanceAmount: number;
  status: BillStatus;
  notes: string;
  payments: VendorBillPaymentDto[];
  createdAt: string;
  updatedAt: string;
}

export interface RevenueDto {
  id: string;
  revenueDate: string;
  clientId: string | null;
  clientNameFreeText: string | null;
  staffId: string;
  staffName?: string;
  category: RevenueCategory;
  amount: number;
  paymentMode: PaymentMode;
  referenceNo: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface RevenueSummaryResponse {
  period: 'today' | 'mtd' | 'custom';
  totalRevenue: number;
  transactionCount: number;
  topClient: { name: string; amount: number } | null;
  topPerformer: { name: string; amount: number } | null;
  clientWise: { name: string; amount: number; percentage: number }[];
  staffWise: { name: string; amount: number; count: number }[];
  categoryWise: { category: RevenueCategory; amount: number; count: number }[];
  monthlyTrend: { month: string; amount: number }[];
}

export interface ExpenseDto {
  id: string;
  expenseDate: string;
  category: ExpenseCategory;
  amount: number;
  fieldVisitId: string | null;
  receiptReference: string | null;
  notes: string;
  status: ExpenseStatus;
  submittedBy: string;
  submittedByName?: string;
  approverId: string;
  approverName?: string;
  decisionRemarks: string | null;
  decidedAt: string | null;
  reimbursedAt: string | null;
  reimbursementMode: PaymentMode | null;
  reimbursementReference: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardDto {
  role: Role;
  metrics: {
    totalLeads: number;
    liveLeads: number;
    workInProgress: number;
    closedDeals: number;
    pendingApprovals: number;
    totalOutstanding: number;
    pipelineValue: number;
    todayRevenue: number;
    mtdRevenue: number;
    vendorPayable: number;
    staffCheckedIn: number;
    activeFieldVisits: number;
    // Staff specific
    myLeads?: number;
    myCallsToday?: number;
    myPendingApprovals?: number;
    myExpenses?: number;
    myAttendanceStatus?: AttendanceStatus;
    myFollowUpsDueToday?: number;
  };
  leadStatusDistribution: { stage: PipelineStage; count: number }[];
  sourceWiseLeads: { source: LeadSource; count: number }[];
  monthlyRevenueTrend: { month: string; revenue: number }[];
  departmentPerformance: { department: Department; revenue: number; leads: number }[];
  stuckLeads: LeadDto[];
  myPendingApprovalsList?: ApprovalStepState[];
  teamActivityToday?: { staffName: string; action: string; time: string }[];
}

export interface TeamPerformanceUserDto {
  userId: string;
  fullName: string;
  department: Department;
  leadCount: number;
  callCount: number;
  closedDealValue: number;
  revenueContribution: number;
  attendancePercentage: number;
  pendingExpenses: number;
}

export interface NotificationDto {
  id: string;
  type: NotificationType;
  severity: Severity;
  title: string;
  message: string;
  targetUserId: string | null;
  targetRole: Role | null;
  targetDepartment: Department | null;
  entityType: string;
  entityId: string;
  readAt: string | null;
  createdAt: string;
}

export interface SettingsDto {
  inactiveLeadReminderDays: number;
  outstandingEscalationDays: number;
  approvalSlaHours: number;
  dailyEmailDigest: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  fiscalYearStartMonth: number;
  approverMapping: Record<ApprovalStep, string>; // step -> role/user designation
}

export interface AuditLogDto {
  id: string;
  actorId: string;
  actorName: string;
  action: string;
  module: ModuleKey;
  entityId: string;
  targetUserId?: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  createdAt: string;
}
