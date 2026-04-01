'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const BRAND = '#0062ff';
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
      <div className="h-14 flex items-center px-5 border-b border-zinc-200 shrink-0">
        <span className="text-base font-bold tracking-tight" style={{ color: BRAND }}>UNIFESTO</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map((s) => (
          <div key={s.group} className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 px-2 mb-1">{s.group}</p>
            {s.items.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}
                  style={active ? { backgroundColor: BRAND } : {}}
                  className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-sm mb-0.5 transition-colors ${active ? 'text-white font-medium' : 'text-zinc-600 hover:bg-zinc-100 hover:text-black'}`}>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-zinc-200 p-3 shrink-0">
        <a href="/" className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-zinc-500 hover:bg-zinc-100 hover:text-black transition-colors">
          ← Back to Site
        </a>
      </div>
    </aside>
  );
}
