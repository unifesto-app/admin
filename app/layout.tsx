import type { ReactNode } from 'react';
import localFont from 'next/font/local';
import './globals.css';

const sweetApricot = localFont({
  src: './assets/fonts/SweetApricot/SweetApricot.ttf',
  variable: '--font-sweet-apricot',
  display: 'swap',
});

export const metadata = {
  title: 'UNIFESTO Admin',
  description: 'UNIFESTO Super Admin Dashboard',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={sweetApricot.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
