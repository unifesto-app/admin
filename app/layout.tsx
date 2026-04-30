import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

// Primary font - Agrandir
const agrandir = localFont({
  src: './assets/fonts/Agrandir/Agrandir-Regular.otf',
  variable: '--font-agrandir',
  display: 'swap',
});

// Logo font - Sweet Apricot
const sweetApricot = localFont({
  src: './assets/fonts/SweetApricot/SweetApricot.ttf',
  variable: '--font-sweet-apricot',
  display: 'swap',
  weight: '400',
  style: 'normal',
});

export const metadata: Metadata = {
  title: 'Unifesto Admin Dashboard',
  description: 'Admin dashboard for Unifesto platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${agrandir.variable} ${sweetApricot.variable} font-sans`}>{children}</body>
    </html>
  );
}
