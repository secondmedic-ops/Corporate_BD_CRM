import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { AppShell } from './components/layout/AppShell';
import { LoginPage } from './pages/auth/LoginPage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LeadsListPage } from './pages/leads/LeadsListPage';
import { LeadDetailPage } from './pages/leads/LeadDetailPage';
import { PipelinePage } from './pages/pipeline/PipelinePage';
import { ColdCallingPage } from './pages/coldcalling/ColdCallingPage';
import { RfqPage } from './pages/rfq/RfqPage';
import { ApprovalsCenterPage } from './pages/approvals/ApprovalsCenterPage';
import { ClientsPage } from './pages/clients/ClientsPage';
import { VendorsPage } from './pages/vendors/VendorsPage';
import { FieldVisitsPage } from './pages/fieldvisits/FieldVisitsPage';
import { AttendancePage } from './pages/attendance/AttendancePage';
import { InvoicesPage } from './pages/invoices/InvoicesPage';
import { VendorBillsPage } from './pages/vendorbills/VendorBillsPage';
import { RevenuePage } from './pages/revenue/RevenuePage';
import { ExpensesPage } from './pages/expenses/ExpensesPage';
import { TeamPage } from './pages/team/TeamPage';
import { UsersPage } from './pages/users/UsersPage';

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="leads" element={<LeadsListPage />} />
            <Route path="leads/:id" element={<LeadDetailPage />} />
            <Route path="pipeline" element={<PipelinePage />} />
            <Route path="cold-calls" element={<ColdCallingPage />} />
            <Route path="rfq" element={<RfqPage />} />
            <Route path="approvals" element={<ApprovalsCenterPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="vendors" element={<VendorsPage />} />
            <Route path="field-visits" element={<FieldVisitsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="vendor-bills" element={<VendorBillsPage />} />
            <Route path="revenue" element={<RevenuePage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="team" element={<TeamPage />} />
            <Route
              path="users"
              element={
                <ProtectedRoute rolesAllowed={['SUPER_MANAGER', 'MANAGER']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="audit-logs"
              element={
                <ProtectedRoute rolesAllowed={['SUPER_MANAGER']}>
                  <UsersPage initialTab="audit" />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}
