'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { group: 'Overview', items: [
    { label: 'Dashboard', href: '/super-admin' },
    { label: 'Analytics', href: '/super-admin/analytics' },
  ]},
  { group: 'Management', items: [
    { label: 'Users', href: '/super-admin/users' },
    { label: 'Events', href: '/super-admin/events' },
    { label: 'Organizations', href: '/super-admin/organizations' },
    { label: 'Roles & Permissions', href: '/super-admin/roles' },
  ]},
  { group: 'Finance', items: [
    { label: 'Transactions', href: '/super-admin/transactions' },
    { label: 'Invoices', href: '/super-admin/invoices' },
    { label: 'Payouts', href: '/super-admin/payouts' },
  ]},
  { group: 'Content', items: [
    { label: 'Announcements', href: '/super-admin/announcements' },
    { label: 'Media Library', href: '/super-admin/media' },
    { label: 'Categories', href: '/super-admin/categories' },
    { label: 'Careers', href: '/super-admin/careers' },
  ]},
  { group: 'System', items: [
    { label: 'Settings', href: '/super-admin/settings' },
    { label: 'Audit Logs', href: '/super-admin/audit-logs' },
    { label: 'API Keys', href: '/super-admin/api-keys' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-60 bg-white border-r border-zinc-200 flex flex-col h-full shrink-0">
      {/* Logo with gradient */}
      <div className="h-14 flex items-center px-5 border-b border-zinc-200 shrink-0">
        <span 
          className="gradient-text"
          style={{
            fontFamily: 'var(--font-sweet-apricot)',
            fontSize: '1.5rem',
            lineHeight: 1,
            paddingLeft: '3px',
            fontWeight: 'normal',
          }}
        >
          unifesto
        </span>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map((s) => (
          <div key={s.group} className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-2 mb-1">{s.group}</p>
            {s.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  style={active ? { background: 'linear-gradient(135deg, #3491ff, #0062ff)' } : {}}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm mb-1 transition-all ${
                    active 
                      ? 'text-white font-semibold shadow-lg shadow-blue-500/20' 
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 font-medium'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      
      <div className="border-t border-zinc-200 p-3 shrink-0">
        <a 
          href="/" 
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900 transition-all font-medium"
        >
          ← Back to Site
        </a>
      </div>
    </aside>
  );
}
