'use client';
import ComingSoon from '../components/ComingSoon';

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-black">Users</h1>
          <p className="text-sm text-zinc-400 mt-0.5">Manage all registered users and their access.</p>
        </div>
      </div>

      <ComingSoon
        feature="User Management"
        description="User management requires backend admin endpoints. Once implemented, you'll be able to view, create, edit, and delete users from this panel."
      />
    </div>
  );
}
