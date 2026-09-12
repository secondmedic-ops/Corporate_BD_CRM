import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ModuleKey, PermissionAction, DataScope, UserRules } from '../types/api';
import { Lock } from 'lucide-react';

export const usePermissions = () => {
  const { user } = useAuth();

  const can = (module: ModuleKey, action: PermissionAction): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_MANAGER') return true;
    const mod = user.permissions?.[module];
    if (!mod) return false;
    return Boolean(mod[action]);
  };

  const scope = (module: ModuleKey): DataScope => {
    if (!user) return 'OWN';
    if (user.role === 'SUPER_MANAGER') return 'ALL';
    return user.permissions?.[module]?.scope || 'OWN';
  };

  const rule = <K extends keyof UserRules>(name: K): UserRules[K] | undefined => {
    if (!user) return undefined;
    return user.rules?.[name];
  };

  const isFieldRestricted = (fieldName: string): boolean => {
    if (!user || user.role === 'SUPER_MANAGER' || user.role === 'MANAGER') return false;
    return Boolean(user.rules?.restrictedFields?.includes(fieldName));
  };

  return {
    user,
    can,
    scope,
    rule,
    isFieldRestricted,
  };
};

export interface CanProps {
  module: ModuleKey;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ module, action, children, fallback = null }) => {
  const { can } = usePermissions();
  if (can(module, action)) {
    return <>{children}</>;
  }
  return <>{fallback}</>;
};

export const RestrictedFieldBadge: React.FC<{ fieldName: string }> = ({ fieldName }) => {
  const { isFieldRestricted } = usePermissions();
  if (!isFieldRestricted(fieldName)) return null;

  return (
    <span
      title="Restricted by your manager"
      className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded ml-2"
    >
      <Lock className="w-3 h-3 text-amber-600" />
      Restricted
    </span>
  );
};
