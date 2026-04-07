import { InputHTMLAttributes, SelectHTMLAttributes } from 'react';

export function BrandInput({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`brand-input ${className}`} />;
}

export function BrandSelect({ className = '', children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`brand-input ${className}`}>
      {children}
    </select>
  );
}
