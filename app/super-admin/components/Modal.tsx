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
        className="absolute inset-0 bg-black/35"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl">
        <h2 className="text-base font-semibold text-black">{title}</h2>
        {children && <div className="mt-3">{children}</div>}
        <div className="mt-5 flex items-center justify-end gap-2">
          <BrandButton variant="outline" onClick={onCancel} disabled={busy}>{cancelLabel}</BrandButton>
          {onConfirm && (
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={`px-4 py-2 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${danger ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-[#0062ff] text-white hover:bg-[#0051d4]'}`}
            >
              {busy ? 'Please wait...' : confirmLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
