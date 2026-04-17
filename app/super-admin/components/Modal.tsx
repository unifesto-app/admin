'use client';

import { ReactNode } from 'react';
import BrandButton from './BrandButton';

interface ModalProps {
  open: boolean;
  title: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm?: () => void;
  onCancel: () => void;
}

export default function Modal({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl animate-fade-in-up">
        <h2 className="text-base font-semibold text-black">{title}</h2>
        {children && <div className="mt-4">{children}</div>}
        <div className="mt-6 flex items-center justify-end gap-3">
          <BrandButton variant="outline" onClick={onCancel} disabled={busy}>{cancelLabel}</BrandButton>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`brand-btn px-5 py-2.5 text-sm rounded-xl font-semibold transition-all disabled:opacity-50 ${
                danger 
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-red-500/30' 
                  : 'brand-btn-solid'
              }`}
            >
              {busy ? 'Please wait...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
