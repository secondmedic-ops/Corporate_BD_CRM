import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import { ModuleKey, PermissionAction } from '../../types/api';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  module?: ModuleKey;
  action?: PermissionAction;
  rolesAllowed?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  module,
  action = 'view',
  rolesAllowed,
}) => {
  const { user, isLoading } = useAuth();
  const { can } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Verifying authorization...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (rolesAllowed && !rolesAllowed.includes(user.role)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-red-50 text-red-600 border border-red-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Role Access Restricted</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          This section is restricted to [{Array.isArray(rolesAllowed) ? rolesAllowed.join(', ') : ''}]. Your current role is{' '}
          <span className="font-semibold text-slate-900">{user.role}</span>.
        </p>
      </div>
    );
  }

  if (module && !can(module, action as PermissionAction)) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center space-y-4">
        <div className="inline-flex p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Permission Denied</h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          You do not have <span className="font-semibold">{action}</span> permission for the module{' '}
          <span className="font-semibold uppercase text-teal-700">{module}</span>.
          Please contact your Department Manager or Super Manager.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
