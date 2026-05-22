import { useState, useEffect } from 'react';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const toast = ({ title, description, variant = 'default' }: ToastProps) => {
    console.log(`Toast: [${variant}] ${title} - ${description}`);
    // Minimal implementation for now to satisfy imports
    // In a real app, this would trigger a UI notification
  };

  return {
    toast,
    toasts,
  };
}
