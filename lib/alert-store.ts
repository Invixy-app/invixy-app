"use client";

import { create } from 'zustand';

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export interface AlertStore extends AlertState {
  showAlert: (alert: Omit<AlertState, 'isOpen' | 'loading'>) => void;
  hideAlert: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAlertStore = create<AlertStore>((set) => ({
  isOpen: false,
  type: 'info',
  title: '',
  message: '',
  loading: false,
  showAlert: (alert) => set({ ...alert, isOpen: true, loading: false }),
  hideAlert: () => set({ 
    isOpen: false, 
    loading: false,
    onConfirm: undefined,
    onCancel: undefined 
  }),
  setLoading: (loading) => set({ loading }),
}));

// Convenience functions
export const showAlert = (
  type: AlertType,
  title: string,
  message: string,
  options?: {
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }
) => {
  useAlertStore.getState().showAlert({
    type,
    title,
    message,
    ...options,
  });
};

export const showConfirm = (
  title: string,
  message: string,
  onConfirm: () => void | Promise<void>,
  options?: {
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }
) => {
  showAlert('confirm', title, message, { onConfirm, ...options });
};

export const showSuccess = (title: string, message: string) => {
  showAlert('success', title, message);
};

export const showError = (title: string, message: string) => {
  showAlert('error', title, message);
};

export const showWarning = (title: string, message: string) => {
  showAlert('warning', title, message);
};

export const showInfo = (title: string, message: string) => {
  showAlert('info', title, message);
};

// Hook for convenient access to alert functions
export const useAlert = () => {
  const store = useAlertStore();
  
  return {
    addAlert: ({ type, title, message }: { type: AlertType; title: string; message: string }) => {
      store.showAlert({ type, title, message });
    },
    showAlert: store.showAlert,
    hideAlert: store.hideAlert,
    showSuccess: (title: string, message: string) => showSuccess(title, message),
    showError: (title: string, message: string) => showError(title, message),
    showWarning: (title: string, message: string) => showWarning(title, message),
    showInfo: (title: string, message: string) => showInfo(title, message),
    showConfirm: (title: string, message: string, onConfirm: () => void | Promise<void>, options?: any) => 
      showConfirm(title, message, onConfirm, options)
  };
};