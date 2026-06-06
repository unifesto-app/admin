'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  CreditCard,
  BarChart3,
  Settings,
  FileText,
  Megaphone,
  Key,
  Shield,
  Briefcase,
  FolderOpen,
  DollarSign,
  Wallet,
  Gift,
  Activity,
  Tag,
  Smartphone,
  Cloud,
  Database,
  HardDrive,
  Mail,
  MessageSquare,
} from 'lucide-react';

const navSections = [
  {
    title: 'Overview',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'User Management',
    items: [
      { href: '/dashboard/users', label: 'Users', icon: Users },
      { href: '/dashboard/spaces', label: 'Spaces', icon: Building2 },
    ],
  },
  {
    title: 'Financial',
    items: [
      { href: '/dashboard/wallet', label: 'Wallet', icon: Wallet },
      { href: '/dashboard/transactions', label: 'Transactions', icon: CreditCard },
      { href: '/dashboard/payouts', label: 'Payouts', icon: DollarSign },
      { href: '/dashboard/referrals', label: 'Referrals', icon: Gift },
      { href: '/dashboard/redeem-codes', label: 'Redeem Codes', icon: Tag },
    ],
  },
  {
    title: 'Content',
    items: [
      { href: '/dashboard/events', label: 'Events', icon: Calendar },
      { href: '/dashboard/announcements', label: 'Announcements', icon: Megaphone },
      { href: '/dashboard/categories', label: 'Categories', icon: FolderOpen },
      { href: '/dashboard/careers', label: 'Careers', icon: Briefcase },
      { href: '/dashboard/media', label: 'Media', icon: FileText },
    ],
  },
  {
    title: 'Analytics',
    items: [
      { href: '/dashboard/analytics', label: 'Web Analytics', icon: BarChart3 },
      { href: '/dashboard/app-analytics', label: 'App Analytics', icon: Smartphone },
      { href: '/dashboard/audit', label: 'Audit Logs', icon: Activity },
    ],
  },
  {
    title: 'System',
    items: [
      { href: '/dashboard/infrastructure-health', label: 'Infrastructure Health', icon: Activity },
      { href: '/dashboard/api-keys', label: 'API Keys', icon: Key },
      { href: '/dashboard/settings', label: 'Settings', icon: Settings },
    ],
  },
  {
    title: 'AWS',
    items: [
      { href: '/dashboard/aws/ec2', label: 'EC2 Instances', icon: HardDrive },
      { href: '/dashboard/aws/rds', label: 'RDS Databases', icon: Database },
      { href: '/dashboard/aws/s3', label: 'S3 Buckets', icon: Cloud },
      { href: '/dashboard/aws/ses', label: 'SES Email', icon: Mail },
      { href: '/dashboard/aws/sns', label: 'SNS Notifications', icon: MessageSquare },
    ],
  },
];

export default function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden lg:block w-64 border-r bg-muted/10 h-full overflow-y-auto">
      <div className="space-y-6 p-4">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="mb-2 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
