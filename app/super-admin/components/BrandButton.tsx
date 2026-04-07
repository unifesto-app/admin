import { ButtonHTMLAttributes } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline';
}

export default function BrandButton({ variant = 'solid', className = '', children, ...props }: Props) {
  const base = 'px-4 py-2 text-sm rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
  const variantClass = variant === 'outline' ? 'brand-btn-outline' : 'brand-btn-solid';
  return (
    <button {...props} className={`${base} brand-btn ${variantClass} ${className}`}>
      {children}
    </button>
  );
}
