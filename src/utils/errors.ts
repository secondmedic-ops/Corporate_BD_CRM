import { ApiError, ErrorCode, RuleBlockedDetails } from '../types/api';

export class AppError extends Error {
  code: ErrorCode;
  field?: string;
  details?: RuleBlockedDetails | Record<string, unknown>;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'AppError';
    this.code = error.code;
    this.field = error.field;
    this.details = error.details;
  }

  getFormattedMessage(): string {
    if (this.code === 'RULE_BLOCKED' && this.details) {
      const d = this.details as RuleBlockedDetails;
      return `${this.message} (rule: ${d.rule || 'system'}${d.limit !== undefined ? `, limit: ${d.limit}` : ''}${d.attempted !== undefined ? `, attempted: ${d.attempted}` : ''}) — contact your manager.`;
    }
    return this.message;
  }
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message: string;
}

type ToastListener = (toast: ToastMessage) => void;
const listeners = new Set<ToastListener>();

export const toast = {
  subscribe: (fn: ToastListener) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  show: (type: ToastType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    listeners.forEach((fn) => fn({ id, type, title, message }));
  },
  success: (message: string, title = 'Success') => toast.show('success', title, message),
  error: (message: string, title = 'Error') => toast.show('error', title, message),
  warning: (message: string, title = 'Warning') => toast.show('warning', title, message),
  info: (message: string, title = 'Info') => toast.show('info', title, message),
};
