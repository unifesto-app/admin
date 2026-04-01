import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'UNIFESTO Admin',
  description: 'UNIFESTO Super Admin Dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
