export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastInput {
  variant: ToastVariant;
  title: string;
  message?: string;
  /** Milliseconds before auto-dismiss. Defaults per variant (errors stay longer). */
  duration?: number;
}

export interface ToastItem extends ToastInput {
  id: string;
}
