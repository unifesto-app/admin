export default function PayoutsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Payouts</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage and process payouts to organizers and organizations.</p>
        </div>
        <button className="px-4 py-2 bg-black text-white text-sm rounded-lg hover:bg-zinc-800 transition-colors">
          Process Payout
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {['Pending Payouts', 'Processed This Month', 'Total Paid Out', 'On Hold'].map((label) => (
          <div key={label} className="bg-white border border-zinc-200 rounded-xl p-5">
            <p className="text-xs text-zinc-400 uppercase tracking-wide mb-2">{label}</p>
            <div className="h-6 w-20 bg-zinc-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          placeholder="Search by org or payout ID..."
          className="border border-zinc-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-black"
        />
        <select className="border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-600 focus:outline-none focus:border-black">
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50">
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Payout ID</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Recipient</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Amount</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Method</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Requested</th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-500 uppercase tracking-wide">Processed</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={8} className="px-5 py-16 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-400 text-lg">◐</div>
                  <p className="text-sm font-medium text-zinc-500">No payouts yet</p>
                  <p className="text-xs text-zinc-400">Payout requests will appear here once organizers request withdrawals.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-zinc-400">
        <span>Showing 0 results</span>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40" disabled>Previous</button>
          <button className="px-3 py-1.5 border border-zinc-200 rounded-lg disabled:opacity-40" disabled>Next</button>
        </div>
      </div>
    </div>
  );
}
