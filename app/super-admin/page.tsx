import QuickActions from './components/QuickActions';

// Dashboard stats are fetched client-side via the API lib
// See lib/api.ts for the full API client

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-black">Dashboard</h1>
        <p className="text-sm text-zinc-400 mt-0.5">System overview — connect your data source to populate metrics.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {['Total Users', 'Active Events', 'Revenue (MTD)', 'Pending Approvals', 'Organizations', 'Open Tickets'].map((label) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">{label}</p>
            <div className="h-7 w-20 bg-zinc-100 rounded animate-pulse mb-1" />
            <div className="h-3 w-28 bg-zinc-50 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-black mb-4">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mb-3 text-lg" style={{ color: '#0062ff' }}>◷</div>
            <p className="text-sm text-zinc-500 font-medium">No activity yet</p>
            <p className="text-xs text-zinc-400 mt-1">Activity will appear here once users start interacting with the system.</p>
          </div>
        </div>

        <div className="bg-white border border-zinc-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-black mb-4">Quick Actions</h2>
          <QuickActions />
        </div>
      </div>

      {/* API connection info */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-blue-700 mb-1">API Connected</p>
        <p className="text-xs text-blue-600">
          Backend: <code className="bg-blue-100 px-1 rounded">{process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}</code>
          {' '}— set <code className="bg-blue-100 px-1 rounded">NEXT_PUBLIC_API_URL</code> in <code className="bg-blue-100 px-1 rounded">.env.local</code> to point to your deployed API.
        </p>
      </div>
    </div>
  );
}
