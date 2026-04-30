import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, CreditCard } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch dashboard statistics
  const [usersCount, orgsCount, eventsCount, transactionsCount] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('organizations').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('transactions').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    {
      title: 'Total Users',
      value: usersCount.count?.toLocaleString() ?? '0',
      description: 'Registered users',
      icon: Users,
      trend: '+12% from last month',
    },
    {
      title: 'Organizations',
      value: orgsCount.count?.toLocaleString() ?? '0',
      description: 'Active organizations',
      icon: Building2,
      trend: '+5% from last month',
    },
    {
      title: 'Events',
      value: eventsCount.count?.toLocaleString() ?? '0',
      description: 'Total events',
      icon: Calendar,
      trend: '+18% from last month',
    },
    {
      title: 'Transactions',
      value: transactionsCount.count?.toLocaleString() ?? '0',
      description: 'All transactions',
      icon: CreditCard,
      trend: '+23% from last month',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome to the Unifesto admin dashboard
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <p className="text-xs text-green-600 mt-1">{stat.trend}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest updates across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <p className="font-medium">New user registered</p>
                  <p className="text-muted-foreground text-xs">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <div className="flex-1">
                  <p className="font-medium">Event published</p>
                  <p className="text-muted-foreground text-xs">15 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <div className="flex-1">
                  <p className="font-medium">Transaction completed</p>
                  <p className="text-muted-foreground text-xs">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common administrative tasks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
              Create new user
            </button>
            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
              Add organization
            </button>
            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
              Publish announcement
            </button>
            <button className="w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent transition-colors">
              View reports
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
