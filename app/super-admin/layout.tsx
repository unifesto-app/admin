import { ReactNode } from 'react';
import Sidebar from './components/Sidebar';
import PageViewTracker from './components/PageViewTracker';
import LogoutButton from './components/LogoutButton';
import { ToastProvider } from './components/ToastProvider';

// Force dynamic rendering - admin pages require runtime authentication
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#fafafa] overflow-hidden">
        <PageViewTracker />
        <Sidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Header with gradient accent */}
          <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-8 shrink-0 relative">
            {/* Gradient top border */}
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ background: 'linear-gradient(135deg, #3491ff, #0062ff)' }}
            />
            
            <div className="flex items-center gap-3">
              <h1 
                className="gradient-text"
                style={{
                  fontFamily: 'var(--font-sweet-apricot)',
                  fontSize: '2rem',
                  lineHeight: 1,
                  paddingLeft: '3px',
                  fontWeight: 'normal',
                }}
              >
                unifesto
              </h1>
              <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Admin</span>
            </div>
            
            <div className="flex items-center gap-4">
              <LogoutButton />
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-zinc-900">Super Admin</p>
                  <p className="text-xs text-zinc-500">Full Access</p>
                </div>
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #3491ff, #0062ff)' }}
                >
                  SA
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-8 bg-[#fafafa]">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
