import { ReactNode } from 'react';
import Sidebar from './components/Sidebar';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-6 shrink-0">
          <p className="text-sm text-zinc-400">UNIFESTO Admin</p>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-full">Super Admin</span>
            <div className="w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-semibold" style={{ backgroundColor: '#0062ff' }}>SA</div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
